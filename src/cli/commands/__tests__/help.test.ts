import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '../types.js';

// Mock the command registry to avoid circular dependency
vi.mock('../index.js', () => ({
  commandRegistry: {
    getAllCommands: vi.fn(() => ['help', 'quit', 'context']),
    getCommand: vi.fn((name: string) => {
      const commands: Record<string, any> = {
        help: { name: 'help', description: 'Show available commands' },
        quit: { name: 'quit', description: 'Exit the application', aliases: ['exit'] },
        context: { name: 'context', description: 'Show files in context' },
      };
      return commands[name];
    }),
  },
}));

describe('help command', () => {
  let mockContext: CommandContext;
  let helpCommand: any;

  beforeEach(async () => {
    mockContext = {
      exit: vi.fn(),
      setHistory: vi.fn(),
      setIsLoading: vi.fn(),
      getNextMessageId: vi.fn(() => 1),
      getContextFiles: vi.fn(() => []),
      input: '',
      args: [],
    };

    // Import after mocking
    const module = await import('../help.js');
    helpCommand = module.helpCommand;
  });

  it('has correct name', () => {
    expect(helpCommand.name).toBe('help');
  });

  it('has correct description', () => {
    expect(helpCommand.description).toBe('Show available commands');
  });

  it('lists all available commands', () => {
    helpCommand.execute(mockContext);
    
    expect(mockContext.setHistory).toHaveBeenCalled();
    expect(mockContext.setIsLoading).toHaveBeenCalledWith(false);
    
    const setHistoryFn = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = setHistoryFn([]);
    
    expect(newHistory).toHaveLength(1);
    expect(newHistory[0].type).toBe('assistant');
    expect(newHistory[0].text).toContain('Available commands:');
  });

  it('includes command names in output', () => {
    helpCommand.execute(mockContext);
    
    const setHistoryFn = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = setHistoryFn([]);
    
    const text = newHistory[0].text;
    expect(text).toContain('/help');
    expect(text).toContain('/quit');
    expect(text).toContain('/context');
  });

  it('includes command descriptions', () => {
    helpCommand.execute(mockContext);
    
    const setHistoryFn = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = setHistoryFn([]);
    
    const text = newHistory[0].text;
    expect(text).toContain('Show available commands');
    expect(text).toContain('Exit the application');
    expect(text).toContain('Show files in context');
  });

  it('includes command aliases', () => {
    helpCommand.execute(mockContext);
    
    const setHistoryFn = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = setHistoryFn([]);
    
    const text = newHistory[0].text;
    expect(text).toContain('aliases:');
    expect(text).toContain('/exit');
  });

  it('generates correct message ID', () => {
    const mockGetId = vi.fn(() => 42);
    mockContext.getNextMessageId = mockGetId;
    
    helpCommand.execute(mockContext);
    
    expect(mockGetId).toHaveBeenCalled();
    
    const setHistoryFn = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = setHistoryFn([]);
    
    expect(newHistory[0].id).toBe(42);
  });

  it('appends to existing history', () => {
    const existingHistory = [
      { id: 1, type: 'user' as const, text: 'previous message' }
    ];
    
    helpCommand.execute(mockContext);
    
    const setHistoryFn = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = setHistoryFn(existingHistory);
    
    expect(newHistory).toHaveLength(2);
    expect(newHistory[0]).toEqual(existingHistory[0]);
    expect(newHistory[1].type).toBe('assistant');
  });
});
