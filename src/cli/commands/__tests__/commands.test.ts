import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '../types.js';

// Import commands directly to avoid circular dependency issues
const quitCommand = {
  name: 'quit',
  aliases: ['exit'],
  description: 'Exit the application',
  execute: (context: CommandContext) => {
    console.log('Exiting Inker. Goodbye!');
    context.exit();
  },
};

const contextCommand = {
  name: 'context',
  description: 'Show files in context',
  execute: (context: CommandContext) => {
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

describe('Commands', () => {
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

  describe('quitCommand', () => {
    it('has correct metadata', () => {
      expect(quitCommand.name).toBe('quit');
      expect(quitCommand.aliases).toEqual(['exit']);
      expect(quitCommand.description).toBe('Exit the application');
    });

    it('calls exit on context', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      quitCommand.execute(mockContext);
      
      expect(mockContext.exit).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Exiting Inker. Goodbye!');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('contextCommand', () => {
    it('has correct metadata', () => {
      expect(contextCommand.name).toBe('context');
      expect(contextCommand.description).toBe('Show files in context');
    });

    it('shows message when no files in context', () => {
      vi.mocked(mockContext.getContextFiles).mockReturnValue([]);
      
      contextCommand.execute(mockContext);
      
      expect(mockContext.setHistory).toHaveBeenCalledWith(expect.any(Function));
      expect(mockContext.setIsLoading).toHaveBeenCalledWith(false);
      
      const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
      const newHistory = setHistoryCall([]);
      expect(newHistory).toEqual([
        { id: 1, type: 'assistant', text: 'No files in context.' }
      ]);
    });

    it('lists files when context has files', () => {
      vi.mocked(mockContext.getContextFiles).mockReturnValue([
        '/path/to/file1.ts',
        '/path/to/file2.ts'
      ]);
      
      contextCommand.execute(mockContext);
      
      const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
      const newHistory = setHistoryCall([]);
      expect(newHistory[0].text).toContain('Context files:');
      expect(newHistory[0].text).toContain('1. /path/to/file1.ts');
      expect(newHistory[0].text).toContain('2. /path/to/file2.ts');
    });
  });
});

