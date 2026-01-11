import type { Command, CommandContext } from './types.js';

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.commands.set(alias, command);
      });
    }
  }

  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): string[] {
    const uniqueCommands = new Set<string>();
    this.commands.forEach(cmd => uniqueCommands.add(cmd.name));
    return Array.from(uniqueCommands).sort();
  }

  getAllCommandsWithAliases(): string[] {
    return Array.from(this.commands.keys()).sort();
  }

  async execute(input: string, context: CommandContext): Promise<boolean> {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return false;
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1);

    const command = this.getCommand(commandName);
    if (!command) {
      return false;
    }

    await command.execute({ ...context, input: trimmed, args });
    return true;
  }
}
