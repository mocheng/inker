import type { Command } from './types.js';

export const quitCommand: Command = {
  name: 'quit',
  aliases: ['exit'],
  description: 'Exit the application',
  execute: (context) => {
    console.log('Exiting Inker. Goodbye!');
    context.exit();
  },
};
