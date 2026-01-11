import type { Command } from './types.js';
import { commandRegistry } from './index.js';

export const helpCommand: Command = {
  name: 'help',
  description: 'Show available commands',
  execute: (context) => {
    const commands = commandRegistry.getAllCommands();
    const commandList = commands.map(cmdName => {
      const cmd = commandRegistry.getCommand(cmdName);
      if (!cmd) return '';
      const aliases = cmd.aliases ? ` (aliases: ${cmd.aliases.map(a => `/${a}`).join(', ')})` : '';
      return `  /${cmd.name}${aliases}\n    ${cmd.description}`;
    }).join('\n\n');
    
    const responseId = context.getNextMessageId();
    context.setHistory(prev => [...prev, { 
      id: responseId, 
      type: 'assistant', 
      text: `Available commands:\n\n${commandList}` 
    }]);
    context.setIsLoading(false);
  },
};
