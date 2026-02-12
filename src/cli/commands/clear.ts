import type { Command } from './types.js';

export const clearCommand: Command = {
  name: 'clear',
  description: 'Clear all chat history',
  execute: (context) => {
    // Clear history and add system message in one call
    const id = context.getNextMessageId();
    context.setHistory(() => [{ id, type: 'system', text: 'Chat history cleared' }]);
    context.setIsLoading(false);
  },
};
