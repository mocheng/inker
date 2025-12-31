import { igniteModel, loadModels, Message, logger } from 'multi-llm-ts';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';
import { getSystemPrompt } from '../config/config.js';

dotenv.config({ quiet: true });
logger.disable(); // necessary, otherwise logging will screw up the CLI output

let cachedModel: any = null;

async function getModel(): Promise<any> {
  if (cachedModel) {
    return cachedModel;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in .env file');
  }

  const config = { apiKey };
  const models = await loadModels('google', config);
  
  if (!models || !models.chat || models.chat.length === 0) {
    throw new Error('No Google models available');
  }
  
  cachedModel = igniteModel('google', models.chat[0], config);
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
  
  for await (const chunk of model.generate(messages)) {
    if (chunk.type === 'content' && chunk.text) {
      fullResponse += chunk.text;
      buffer += chunk.text;
      flushBuffer();
    }
  }
  
  flushBuffer.flush();
  
  return fullResponse;
}
