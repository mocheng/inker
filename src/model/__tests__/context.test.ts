import { describe, it, expect } from 'vitest';
import { convertToLLMMessages } from '../context.js';
import type { Message } from '../../cli/types.js';

describe('context', () => {
  describe('convertToLLMMessages', () => {
    it('converts user and assistant messages', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'assistant', text: 'Hi there' },
      ];

      const result = convertToLLMMessages(history);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ]);
    });

    it('filters out system messages', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'system', text: 'System message' },
        { id: 3, type: 'assistant', text: 'Hi' },
      ];

      const result = convertToLLMMessages(history);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ]);
    });

    it('handles empty history', () => {
      const result = convertToLLMMessages([]);
      expect(result).toEqual([]);
    });

    it('preserves message order', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'First' },
        { id: 2, type: 'assistant', text: 'Second' },
        { id: 3, type: 'user', text: 'Third' },
      ];

      const result = convertToLLMMessages(history);

      expect(result).toEqual([
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Second' },
        { role: 'user', content: 'Third' },
      ]);
    });
  });
});
