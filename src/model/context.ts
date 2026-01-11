import { ModelMessage } from 'ai';
import type { Message as UIMessage } from '../cli/types.js';

export function convertToLLMMessages(history: UIMessage[]): ModelMessage[] {
  return history
    .filter(msg => msg.type === 'user' || msg.type === 'assistant')
    .map(msg => ({ role: msg.type as 'user' | 'assistant', content: msg.text }));
}
