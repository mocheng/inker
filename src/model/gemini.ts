import { igniteModel, loadModels, Message, logger } from 'multi-llm-ts';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';
import { getSystemPrompt } from '../config/config.js';
import { BashPlugin } from './plugins/BashPlugin.js';
import { ModelAdapter, MockModelAdapter } from './modelAdapter.js';
import { trace } from '@opentelemetry/api';

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
  const tracer = trace.getTracer('inker');
  
  return tracer.startActiveSpan('gemini.chat', async (span) => {
    try {
      span.setAttribute('llm.model', process.env.GEMINI_MODEL || 'gemini-2.0-flash');
      span.setAttribute('llm.request.user_message', message);
      
      const historyForTelemetry = conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content.slice(0, 500) : String(msg.content).slice(0, 500)
      }));
      span.setAttribute('llm.request.history', JSON.stringify(historyForTelemetry));
      
      const model = await getModelAdapter();

      const messages = [
        new Message('system', getSystemPrompt()),
        ...conversationHistory,
        new Message('user', message)
      ];
      
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
        
        await tracer.startActiveSpan(`gemini.generate.${iterationCount}`, async (genSpan) => {
          try {
            genSpan.setAttribute('llm.iteration', iterationCount);
            genSpan.setAttribute('llm.message_count', messages.length);
            genSpan.setAttribute('llm.request.messages', JSON.stringify(messages.map(m => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : String(m.content)
            }))));
            
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
            
            genSpan.setAttribute('llm.response.content', iterationResponse);
            genSpan.setAttribute('llm.has_tool_calls', hasToolCalls);
            genSpan.setStatus({ code: 1 });
          } catch (error) {
            genSpan.recordException(error as Error);
            genSpan.setStatus({ code: 2 });
            throw error;
          } finally {
            genSpan.end();
          }
        });
        
        flushBuffer.flush();
        iterationCount++;
        
        if (!hasToolCalls) break;
        
        for (const result of toolResults) {
          messages.push(new Message('user', `Tool result from ${result.name}: ${result.result}`));
        }
      }
      
      span.setAttribute('llm.response.message', fullResponse);
      span.setStatus({ code: 1 });
      return fullResponse;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  });
}
