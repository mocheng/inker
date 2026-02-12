import { CommandRegistry } from './CommandRegistry.js';
import { quitCommand } from './quit.js';
import { contextCommand } from './context.js';
import { helpCommand } from './help.js';
import { clearCommand } from './clear.js';
import { exportCommand } from './export.js';
import { saveCommand } from './save.js';

export const commandRegistry = new CommandRegistry();

// Register all commands
commandRegistry.register(quitCommand);
commandRegistry.register(contextCommand);
commandRegistry.register(helpCommand);
commandRegistry.register(clearCommand);
commandRegistry.register(exportCommand);
commandRegistry.register(saveCommand);

export { CommandRegistry } from './CommandRegistry.js';
export type { Command, CommandContext } from './types.js';
