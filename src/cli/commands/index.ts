import { CommandRegistry } from './CommandRegistry.js';
import { quitCommand } from './quit.js';
import { contextCommand } from './context.js';
import { helpCommand } from './help.js';

export const commandRegistry = new CommandRegistry();

// Register all commands
commandRegistry.register(quitCommand);
commandRegistry.register(contextCommand);
commandRegistry.register(helpCommand);

export { CommandRegistry } from './CommandRegistry.js';
export type { Command, CommandContext } from './types.js';
