import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import type { CommandContext } from '../types.js';
import { exportCommand } from '../export.js';

// Mock fs module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(),
  };
});

// Mock path module
vi.mock('path', () => ({
  resolve: vi.fn((...args: string[]) => args.join('/')),
}));

describe('exportCommand', () => {
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

    vi.clearAllMocks();

    // Setup mocks for each test
    if (fs.writeFileSync && typeof (fs.writeFileSync as any).mockReset === 'function') {
      (fs.writeFileSync as any).mockReset();
    }
  });

  it('exports history to default filename', () => {
    const testHistory = [
      { id: 0, type: 'user' as const, text: 'Hello' },
      { id: 1, type: 'assistant' as const, text: 'Hi there!' },
    ];

    exportCommand.execute(mockContext);

    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0]?.[0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall(testHistory) : setHistoryCall;
    
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(newHistory?.[newHistory?.length - 1]?.type).toBe('system');
    expect(newHistory?.[newHistory?.length - 1]?.text).toMatch(/✓ Exported to/);
  });

  it('uses custom filename when provided', () => {
    mockContext.args = ['my-export.md'];
    const testHistory = [{ id: 0, type: 'user' as const, text: 'Test' }];

    exportCommand.execute(mockContext);

    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0]?.[0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall(testHistory) : setHistoryCall;
    
    expect(newHistory?.[newHistory?.length - 1]?.text).toContain('my-export.md');
  });

  it('generates correct markdown format', () => {
    const testHistory = [
      { id: 0, type: 'user' as const, text: 'Hello, how are you?' },
      { id: 1, type: 'assistant' as const, text: 'I am doing well, thank you!' },
    ];

    exportCommand.execute(mockContext);

    const calls = (fs.writeFileSync as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const writeContent = calls[0][1];
    
    expect(writeContent).toContain('# Inker Chat Export');
    expect(writeContent).toContain('## 👤 User');
    expect(writeContent).toContain('Hello, how are you?');
    expect(writeContent).toContain('## 🤖 Assistant');
    expect(writeContent).toContain('I am doing well, thank you!');
  });

  it('handles export errors gracefully', () => {
    (fs.writeFileSync as any).mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const testHistory = [{ id: 0, type: 'user' as const, text: 'Test' }];
    exportCommand.execute(mockContext);

    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0]?.[0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall(testHistory) : setHistoryCall;
    
    expect(newHistory?.[newHistory?.length - 1]?.type).toBe('error');
    expect(newHistory?.[newHistory?.length - 1]?.text).toContain('Export failed');
  });

  it('returns correct command metadata', () => {
    expect(exportCommand.name).toBe('export');
    expect(exportCommand.description).toContain('Export chat history');
    expect(exportCommand.aliases).toBeUndefined();
  });
});
