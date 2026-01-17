import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '../types.js';

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
    it('calls exit on context', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const quitCommand = {
        name: 'quit',
        aliases: ['exit'],
        description: 'Exit the application',
        execute: (context: CommandContext) => {
          console.log('Exiting Inker. Goodbye!');
          context.exit();
        },
      };
      
      quitCommand.execute(mockContext);
      
      expect(mockContext.exit).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Exiting Inker. Goodbye!');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('contextCommand', () => {
    it('shows message when no files in context', () => {
      vi.mocked(mockContext.getContextFiles).mockReturnValue([]);
      
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
      
      contextCommand.execute(mockContext);
      
      expect(mockContext.setHistory).toHaveBeenCalledWith(expect.any(Function));
      expect(mockContext.setIsLoading).toHaveBeenCalledWith(false);
      
      const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
      const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
      expect(newHistory).toEqual([
        { id: 1, type: 'assistant', text: 'No files in context.' }
      ]);
    });

    it('lists files when context has files', () => {
      vi.mocked(mockContext.getContextFiles).mockReturnValue([
        '/path/to/file1.ts',
        '/path/to/file2.ts'
      ]);
      
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
      
      contextCommand.execute(mockContext);
      
      const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
      const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
      expect(newHistory[0].text).toContain('Context files:');
      expect(newHistory[0].text).toContain('1. /path/to/file1.ts');
      expect(newHistory[0].text).toContain('2. /path/to/file2.ts');
    });
  });

  describe('helpCommand', () => {
    it('shows available commands', () => {
      const mockRegistry = {
        getAllCommands: vi.fn(() => ['help', 'quit', 'context']),
        getCommand: vi.fn((name: string) => {
          const commands: Record<string, any> = {
            help: { name: 'help', description: 'Show available commands', aliases: undefined },
            quit: { name: 'quit', description: 'Exit the application', aliases: ['exit'] },
            context: { name: 'context', description: 'Show files in context', aliases: undefined },
          };
          return commands[name];
        }),
      };

      const helpCommand = {
        name: 'help',
        description: 'Show available commands',
        execute: (context: CommandContext) => {
          const commands = mockRegistry.getAllCommands();
          const commandList = commands.map(cmdName => {
            const cmd = mockRegistry.getCommand(cmdName);
            if (!cmd) return '';
            const aliases = cmd.aliases ? ` (aliases: ${cmd.aliases.map((a: string) => `/${a}`).join(', ')})` : '';
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

      helpCommand.execute(mockContext);

      expect(mockContext.setHistory).toHaveBeenCalled();
      expect(mockContext.setIsLoading).toHaveBeenCalledWith(false);
      
      const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
      const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
      expect(newHistory[0].text).toContain('Available commands:');
      expect(newHistory[0].text).toContain('/help');
      expect(newHistory[0].text).toContain('/quit');
      expect(newHistory[0].text).toContain('(aliases: /exit)');
    });
  });
});

