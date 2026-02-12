import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '../types.js';
import { clearCommand } from '../clear.js';

describe('clearCommand', () => {
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

  it('clears history and adds system message', () => {
    clearCommand.execute(mockContext);

    expect(mockContext.setIsLoading).toHaveBeenCalledWith(false);
    expect(mockContext.setHistory).toHaveBeenCalledWith(expect.any(Function));

    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall([]) : setHistoryCall;
    expect(newHistory).toEqual([
      { id: 1, type: 'system', text: 'Chat history cleared' }
    ]);
  });

  it('returns correct command metadata', () => {
    expect(clearCommand.name).toBe('clear');
    expect(clearCommand.description).toBe('Clear all chat history');
    expect(clearCommand.aliases).toBeUndefined();
  });

  it('resets history to empty array', () => {
    const existingHistory = [
      { id: 0, type: 'user' as const, text: 'Hello' },
      { id: 1, type: 'assistant' as const, text: 'Hi there!' },
    ];

    clearCommand.execute(mockContext);

    const setHistoryCall = vi.mocked(mockContext.setHistory).mock.calls[0][0];
    const newHistory = typeof setHistoryCall === 'function' ? setHistoryCall(existingHistory) : setHistoryCall;
    expect(newHistory).toHaveLength(1); // Only the system message
    expect(newHistory[0].type).toBe('system');
  });
});
