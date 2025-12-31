import { igniteModel, loadModels, Message, logger } from 'multi-llm-ts';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';

dotenv.config({ quiet: true });
logger.disable(); // necessary, otherwise logging will screw up the CLI output

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
  onChunk: (chunk: string) => void
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-pro';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in .env file');
  }

  const config = { apiKey };
  const models = await loadModels('google', config);
  
  if (!models || !models.chat || models.chat.length === 0) {
    throw new Error('No Google models available');
  }
  
  const model = igniteModel('google', models.chat[0], config);
  
  const messages = [new Message('user', message)];
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
