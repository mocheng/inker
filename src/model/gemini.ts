import { igniteModel, loadModels, Message, logger } from 'multi-llm-ts';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';
import { getSystemPrompt } from '../config/config.js';
import { BashPlugin } from './plugins/BashPlugin.js';

dotenv.config({ quiet: true });
logger.disable(); // necessary, otherwise logging will screw up the CLI output

let cachedModel: any = null;

async function getModel(): Promise<any> {
  if (cachedModel) {
    return cachedModel;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in .env file');
  }

  const config = { apiKey };
  
  // Create model with tool capability explicitly enabled
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
  
  // Add bash plugin
  cachedModel.addPlugin(new BashPlugin());
  
  return cachedModel;
}

/*
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
  const model = await getModel();

  const messages = [
    new Message('system', getSystemPrompt()),
    ...conversationHistory,
    new Message('user', message)
  ];
  
  let fullResponse = '';
  let buffer = '';
  
  const flushBuffer = throttle(() => {
    if (buffer) {
      onChunk(buffer);
      buffer = '';
    }
  }, 100);
  
  while (true) {
    let hasToolCalls = false;
    const toolResults: any[] = [];
    
    for await (const chunk of model.generate(messages)) {
      if (chunk.type === 'content' && chunk.text) {
        fullResponse += chunk.text;
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
          toolResults.push(chunk);
        }
      }
    }
    
    flushBuffer.flush();
    
    if (!hasToolCalls) break;
    
    // Add tool results to messages and continue loop
    for (const result of toolResults) {
      messages.push(new Message('user', `Tool result from ${result.name}: ${result.result}`));
    }
  }
  
  return fullResponse;
}
