import { igniteModel, loadModels, Message, logger } from 'multi-llm-ts';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';
import { getSystemPrompt } from '../config/config.js';
import { BashPlugin } from './plugins/BashPlugin.js';
import { ModelAdapter, MockModelAdapter } from './modelAdapter.js';
import { withSpan } from './tracing.js';

dotenv.config({ quiet: true });
logger.disable();

let cachedModel: any = null;
const useMock = process.env.USE_MOCK_MODEL === 'true';

class RealModelAdapter implements ModelAdapter {
  constructor(private model: any) {}
  
  async *generate(messages: any[]): AsyncGenerator<any> {
    for await (const chunk of this.model.generate(messages)) {
      yield chunk;
    }
  }
}

async function getModelAdapter(): Promise<ModelAdapter> {
  if (useMock) {
    console.log('Using mock model (no API calls)');
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
  cachedModel.addPlugin(new BashPlugin());
  
  return new RealModelAdapter(cachedModel);
}

/*
Mock example - not used anymore, kept for reference
export async function sendMessage(
  message: string, 
  onChunk: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve) => {
    let count = 0;
    let fullResponse = '';
    function sendChunk() {
      if (count < 70) {
        const chunk = `chunk-${count + 1}\n`;
        onChunk(chunk);
        fullResponse += chunk;
        count++;
        setTimeout(sendChunk, 100);
      } else {
        resolve(fullResponse);
      }
    }
    sendChunk();
  });
}
*/


export async function sendMessage(
  message: string,
  conversationHistory: any[],
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
      const toolResults: any[] = [];
      
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
        
        let iterationResponse = '';
        
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
              genSpan.addEvent('tool.completed', { 'tool.name': chunk.name });
              
              if (chunk.result === null && chunk.name === 'bash') {
                const bashPlugin = new BashPlugin();
                const result = await bashPlugin.execute({} as any, { command: 'ls -l' });
                chunk.result = JSON.stringify(result);
                
                if (result.stdout) {
                  const lines = result.stdout.split('\n');
                  buffer += lines.map((line: string) => `\x1b[36m${line}\x1b[0m`).join('\n') + '\n';
                }
                if (result.stderr) {
                  const lines = result.stderr.split('\n');
                  buffer += lines.map((line: string) => `\x1b[31m${line}\x1b[0m`).join('\n') + '\n';
                }
                flushBuffer();
              }
              toolResults.push(chunk);
            }
          }
        }
        
        // Set output-json attribute for Genkit UI
        genSpan.setAttribute('output-json', JSON.stringify([{ role: 'assistant', content: iterationResponse }]));
        
        genSpan.setAttribute('llm.has_tool_calls', hasToolCalls);
      });
      
      flushBuffer.flush();
      iterationCount++;
      
      if (!hasToolCalls) break;
      
      for (const result of toolResults) {
        messages.push(new Message('user', `Tool result from ${result.name}: ${result.result}`));
      }
    }
    
    // Set output-json for the chat span (full response)
    span.setAttribute('output-json', JSON.stringify({ response: fullResponse }));
    
    return fullResponse;
  });
}
