import type { Command } from './types.js';

export const contextCommand: Command = {
  name: 'context',
  description: 'Show files in context',
  execute: (context) => {
    const contextFiles = context.getContextFiles();
    const responseId = context.getNextMessageId();
    
    if (contextFiles.length === 0) {
      context.setHistory(prev => [...prev, { id: responseId, type: 'assistant', text: 'No files in context.' }]);
    } else {
      const fileList = contextFiles.map((file, i) => `${i + 1}. ${file}`).join('\n');
      context.setHistory(prev => [...prev, { id: responseId, type: 'assistant', text: `Context files:\n${fileList}` }]);
    }
    context.setIsLoading(false);
  },
};
