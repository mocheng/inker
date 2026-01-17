import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quitCommand } from '../quit.js';
import { contextCommand } from '../context.js';
import type { CommandContext } from '../types.js';

describe('quit command', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
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

  it('has correct name', () => {
    expect(quitCommand.name).toBe('quit');
  });

  it('has correct aliases', () => {
    expect(quitCommand.aliases).toEqual(['exit']);
  });

  it('has correct description', () => {
    expect(quitCommand.description).toBe('Exit the application');
  });

  it('calls exit on execution', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    quitCommand.execute(mockContext);
    
    expect(mockContext.exit).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Exiting Inker. Goodbye!');
    
    consoleLogSpy.mockRestore();
  });
});

describe('context command', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
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

  it('has correct name', () => {
    expect(contextCommand.name).toBe('context');
  });

  it('has correct description', () => {
    expect(contextCommand.description).toBe('Show files in context');
  });

  it('shows no files message when context is empty', () => {
    vi.mocked(mockContext.getContextFiles).mockReturnValue([]);
    
    contextCommand.execute(mockContext);
    
    expect(mockContext.setHistory).toHaveBeenCalled();
    expect(mockContext.setIsLoading).toHaveBeenCalledWith(false);
    
    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
    
    expect(newHistory).toHaveLength(1);
    expect(newHistory[0].type).toBe('assistant');
    expect(newHistory[0].text).toBe('No files in context.');
  });

  it('lists files when context has files', () => {
    vi.mocked(mockContext.getContextFiles).mockReturnValue([
      '/path/to/file1.ts',
      '/path/to/file2.ts',
      '/path/to/file3.ts'
    ]);
    
    contextCommand.execute(mockContext);
    
    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
    
    expect(newHistory[0].text).toContain('Context files:');
    expect(newHistory[0].text).toContain('1. /path/to/file1.ts');
    expect(newHistory[0].text).toContain('2. /path/to/file2.ts');
    expect(newHistory[0].text).toContain('3. /path/to/file3.ts');
  });

  it('numbers files correctly', () => {
    vi.mocked(mockContext.getContextFiles).mockReturnValue([
      '/file1.ts',
      '/file2.ts'
    ]);
    
    contextCommand.execute(mockContext);
    
    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
    
    const lines = newHistory[0].text.split('\n');
    expect(lines[1]).toBe('1. /file1.ts');
    expect(lines[2]).toBe('2. /file2.ts');
  });
});
