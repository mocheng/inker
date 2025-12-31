import { Message as LLMMessage } from 'multi-llm-ts';
import type { Message as UIMessage } from '../cli/types.js';

export function convertToLLMMessages(history: UIMessage[]): LLMMessage[] {
  return history
    .filter(msg => msg.type === 'user' || msg.type === 'assistant')
    .map(msg => new LLMMessage(msg.type as 'user' | 'assistant', msg.text));
}
