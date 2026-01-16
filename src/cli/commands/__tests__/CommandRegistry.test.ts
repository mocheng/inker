import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandRegistry } from '../CommandRegistry.js';
import type { Command, CommandContext } from '../types.js';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  let mockContext: CommandContext;

  beforeEach(() => {
    registry = new CommandRegistry();
    mockContext = {
      exit: vi.fn(),
      setHistory: vi.fn(),
      setIsLoading: vi.fn(),
      getNextMessageId: vi.fn(() => 1),
      getContextFiles: vi.fn(() => []),
      input: '',
      args: [],
    };
  });

  describe('register', () => {
    it('registers a command', () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        execute: vi.fn(),
      };

      registry.register(command);
      expect(registry.getCommand('test')).toBe(command);
    });

    it('registers command aliases', () => {
      const command: Command = {
        name: 'test',
        aliases: ['t', 'tst'],
        description: 'Test command',
        execute: vi.fn(),
      };

      registry.register(command);
      expect(registry.getCommand('test')).toBe(command);
      expect(registry.getCommand('t')).toBe(command);
      expect(registry.getCommand('tst')).toBe(command);
    });
  });

  describe('getCommand', () => {
    it('returns undefined for non-existent command', () => {
      expect(registry.getCommand('nonexistent')).toBeUndefined();
    });

    it('returns command by name', () => {
      const command: Command = {
        name: 'test',
        description: 'Test command',
        execute: vi.fn(),
      };

      registry.register(command);
      expect(registry.getCommand('test')).toBe(command);
    });

    it('returns command by alias', () => {
      const command: Command = {
        name: 'test',
        aliases: ['t'],
        description: 'Test command',
        execute: vi.fn(),
      };

      registry.register(command);
      expect(registry.getCommand('t')).toBe(command);
    });
  });

  describe('getAllCommands', () => {
    it('returns empty array when no commands registered', () => {
      expect(registry.getAllCommands()).toEqual([]);
    });

    it('returns unique command names sorted', () => {
      const cmd1: Command = { name: 'zebra', description: 'Z', execute: vi.fn() };
      const cmd2: Command = { name: 'apple', description: 'A', execute: vi.fn() };
      const cmd3: Command = { name: 'banana', aliases: ['b'], description: 'B', execute: vi.fn() };

      registry.register(cmd1);
      registry.register(cmd2);
      registry.register(cmd3);

      expect(registry.getAllCommands()).toEqual(['apple', 'banana', 'zebra']);
    });
  });

  describe('getAllCommandsWithAliases', () => {
    it('returns all command names and aliases sorted', () => {
      const cmd1: Command = { name: 'test', aliases: ['t'], description: 'Test', execute: vi.fn() };
      const cmd2: Command = { name: 'help', description: 'Help', execute: vi.fn() };

      registry.register(cmd1);
      registry.register(cmd2);

      expect(registry.getAllCommandsWithAliases()).toEqual(['help', 't', 'test']);
    });
  });

  describe('execute', () => {
    it('returns false for non-command input', async () => {
      const result = await registry.execute('regular message', mockContext);
      expect(result).toBe(false);
    });

    it('returns false for non-existent command', async () => {
      const result = await registry.execute('/nonexistent', mockContext);
      expect(result).toBe(false);
    });

    it('executes command and returns true', async () => {
      const executeFn = vi.fn();
      const command: Command = {
        name: 'test',
        description: 'Test command',
        execute: executeFn,
      };

      registry.register(command);
      const result = await registry.execute('/test', mockContext);

      expect(result).toBe(true);
      expect(executeFn).toHaveBeenCalledWith({
        ...mockContext,
        input: '/test',
        args: [],
      });
    });

    it('executes command with arguments', async () => {
      const executeFn = vi.fn();
      const command: Command = {
        name: 'test',
        description: 'Test command',
        execute: executeFn,
      };

      registry.register(command);
      await registry.execute('/test arg1 arg2', mockContext);

      expect(executeFn).toHaveBeenCalledWith({
        ...mockContext,
        input: '/test arg1 arg2',
        args: ['arg1', 'arg2'],
      });
    });

    it('executes command by alias', async () => {
      const executeFn = vi.fn();
      const command: Command = {
        name: 'test',
        aliases: ['t'],
        description: 'Test command',
        execute: executeFn,
      };

      registry.register(command);
      const result = await registry.execute('/t', mockContext);

      expect(result).toBe(true);
      expect(executeFn).toHaveBeenCalled();
    });

    it('handles whitespace in input', async () => {
      const executeFn = vi.fn();
      const command: Command = {
        name: 'test',
        description: 'Test command',
        execute: executeFn,
      };

      registry.register(command);
      await registry.execute('  /test  ', mockContext);

      expect(executeFn).toHaveBeenCalledWith({
        ...mockContext,
        input: '/test',
        args: [],
      });
    });
  });
});
