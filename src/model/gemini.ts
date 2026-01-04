import { igniteModel, Message, logger, type Model } from 'multi-llm-ts';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';
import { getSystemPrompt } from '../config/config.js';
import { BashPlugin } from './plugins/BashPlugin.js';
import { ReadFilePlugin } from './plugins/ReadFilePlugin.js';
import { GitPlugin } from './plugins/GitPlugin.js';
import { WriteFilePlugin } from './plugins/WriteFilePlugin.js';
import { ListDirectoryPlugin } from './plugins/ListDirectoryPlugin.js';
import { EditFilePlugin } from './plugins/EditFilePlugin.js';
import { GrepPlugin } from './plugins/GrepPlugin.js';
import { GlobPlugin } from './plugins/GlobPlugin.js';
import { GithubPRPlugin } from './plugins/GithubPRPlugin.js';
import { ModelAdapter, MockModelAdapter, type Chunk } from './modelAdapter.js';
import { withSpan, logWithSpanCorrelation } from './tracing.js';

dotenv.config({ quiet: true });
logger.disable();

interface ToolResult {
  name: string;
  result: string;
}

let cachedModel: Model | null = null;
const useMock = process.env.USE_MOCK_MODEL === 'true';

class RealModelAdapter implements ModelAdapter {
  constructor(private model: Model) {}
  
  async *generate(messages: Message[]): AsyncGenerator<Chunk> {
    for await (const chunk of this.model.generate(messages)) {
      yield chunk as Chunk;
    }
  }
}

async function getModelAdapter(): Promise<ModelAdapter> {
  if (useMock) {
    // console.log('Using mock model (no API calls)');
    return new MockModelAdapter();
  }

  if (cachedModel) {
    return new RealModelAdapter(cachedModel);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in .env file');
  }

  const config = { apiKey };
  const model = {
    id: modelName,
    name: modelName,
    capabilities: {
      tools: true,
      vision: false,
      reasoning: false,
      caching: false
    }
  };
  
  cachedModel = igniteModel('google', model, config);
  initializePlugins(cachedModel);
  
  return new RealModelAdapter(cachedModel);
}

function initializePlugins(model: Model): void {
  model.addPlugin(new BashPlugin());
  model.addPlugin(new ReadFilePlugin());
  model.addPlugin(new GitPlugin());
  model.addPlugin(new WriteFilePlugin());
  model.addPlugin(new ListDirectoryPlugin());
  model.addPlugin(new EditFilePlugin());
  model.addPlugin(new GrepPlugin());
  model.addPlugin(new GlobPlugin());
  model.addPlugin(new GithubPRPlugin());
}

export async function sendMessage(
  message: string,
  conversationHistory: Message[],
  onChunk: (chunk: string) => void
): Promise<string> {
  return withSpan('gemini.chat', {
    'gen_ai.system': 'google',
    'gen_ai.request.model': process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    'gen_ai.operation.name': 'chat'
  }, async (span) => {
    const model = await getModelAdapter();

    const messages = [
      new Message('system', getSystemPrompt()),
      ...conversationHistory,
      new Message('user', message)
    ];
    
    // Set input-json for the chat span (user message)
    span.setAttribute('input-json', JSON.stringify({ message }));
    
    // Set context-json for the chat span
    span.setAttribute('context-json', JSON.stringify({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      conversationLength: conversationHistory.length
    }));
    
    let fullResponse = '';
    let buffer = '';
    let iterationCount = 0;
    
    const flushBuffer = throttle(() => {
      if (buffer) {
        onChunk(buffer);
        buffer = '';
      }
    }, 100);
    
    while (true) {
      let hasToolCalls = false;
      const toolResults: ToolResult[] = [];
      
      await withSpan(`gemini.generate.${iterationCount}`, {
        'gen_ai.system': 'google',
        'gen_ai.request.model': process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        'gen_ai.operation.name': 'generate',
        'llm.iteration': iterationCount,
        'llm.message_count': messages.length
      }, async (genSpan) => {
        const inputMessages = messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : String(m.content)
        }));
        
        // Set input-json attribute for Genkit UI
        genSpan.setAttribute('input-json', JSON.stringify(inputMessages));
        
        // Set context-json attribute for Genkit UI
        genSpan.setAttribute('context-json', JSON.stringify({
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          iteration: iterationCount,
          messageCount: messages.length
        }));
        
        // Add span events for input messages per OpenTelemetry GenAI semantic conventions
        // https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-events/
        for (const msg of inputMessages) {
          genSpan.addEvent(`gen_ai.${msg.role}.message`, {
            'gen_ai.system': 'google',
            'gen_ai.request.model': process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            'gen_ai.message.role': msg.role,
            'gen_ai.message.content': msg.content,
          });
        }
        
        let iterationResponse = '';
        
        // Log with span correlation before calling model.generate()
        logWithSpanCorrelation('info', 'gen_ai.generate.start', 'Starting model.generate() call', {
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          iteration: iterationCount,
          messageCount: messages.length,
          messages: JSON.stringify(inputMessages),
        });
        
        for await (const chunk of model.generate(messages)) {
          if (chunk.type === 'content' && chunk.text) {
            fullResponse += chunk.text;
            iterationResponse += chunk.text;
            buffer += chunk.text;
            flushBuffer();
          } else if (chunk.type === 'tool') {
            hasToolCalls = true;
            if (chunk.state === 'running' || chunk.state === 'completed') {
              const toolMsg = `[Tool: ${chunk.name}] ${chunk.status}\n`;
              buffer += toolMsg;
              flushBuffer();
            }
            if (chunk.state === 'completed') {
              genSpan.addEvent('tool.completed', { 'tool.name': chunk.name || 'unknown' });
              
              // Tool results should be provided by the plugin system
              // If result is null, it means the tool execution failed or wasn't properly handled
              if (chunk.result !== null && chunk.result !== undefined) {
                toolResults.push({
                  name: chunk.name || 'unknown',
                  result: typeof chunk.result === 'string' ? chunk.result : JSON.stringify(chunk.result)
                });
              }
            }
          }
        }
        
        // Set output-json attribute for Genkit UI
        genSpan.setAttribute('output-json', JSON.stringify([{ role: 'assistant', content: iterationResponse }]));
        
        // Add span event for assistant response per OpenTelemetry GenAI semantic conventions
        genSpan.addEvent('gen_ai.assistant.message', {
          'gen_ai.system': 'google',
          'gen_ai.request.model': process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          'gen_ai.message.role': 'assistant',
          'gen_ai.message.content': iterationResponse,
        });
        
        genSpan.setAttribute('llm.has_tool_calls', hasToolCalls);
      });
      
      flushBuffer.flush();
      iterationCount++;
      
      if (!hasToolCalls) break;
      
      // Add tool results to conversation for next iteration
      for (const result of toolResults) {
        messages.push(new Message('user', `Tool result from ${result.name}: ${result.result}`));
      }
    }
    
    // Set output-json for the chat span (full response)
    span.setAttribute('output-json', JSON.stringify({ response: fullResponse }));
    
    return fullResponse;
  });
}
