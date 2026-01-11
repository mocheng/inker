import type { Message } from '../types.js';

export interface CommandContext {
  input: string;
  args: string[];
  setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  exit: () => void;
  getNextMessageId: () => number;
  getContextFiles: () => string[];
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  execute: (context: CommandContext) => Promise<void> | void;
}
