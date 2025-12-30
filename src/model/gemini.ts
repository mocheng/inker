import { igniteModel, loadModels, Message } from 'multi-llm-ts';
import dotenv from 'dotenv';

dotenv.config();

export async function sendMessage(message: string): Promise<string> {
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
  const response = await model.complete(messages);
  
  return response.content || '';
}
