import { describe, it, expect } from 'vitest';
import {
  updateStreamingMessage,
  handleErrorMessage,
  addUserMessage,
  addAssistantPlaceholder,
  addShellMessage,
  addErrorMessage,
  isBashCommand,
  extractBashCommand,
  shouldUpdateStreaming,
  getCompletedHistory,
  getStreamingItem,
} from '../messageUtils.js';
import type { Message } from '../types.js';

describe('messageUtils', () => {
  describe('updateStreamingMessage', () => {
    it('updates message with matching ID', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'assistant', text: 'Partial' },
      ];

      const result = updateStreamingMessage(history, 2, 'Complete response');

      expect(result[1].text).toBe('Complete response');
      expect(result[0]).toEqual(history[0]);
    });

    it('does not modify messages with different IDs', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'assistant', text: 'Response' },
      ];

      const result = updateStreamingMessage(history, 3, 'New text');

      expect(result).toEqual(history);
    });
  });

  describe('handleErrorMessage', () => {
    it('appends error when partial content exists', () => {
      const history: Message[] = [
        { id: 1, type: 'assistant', text: 'Partial response' },
      ];
      let nextId = 2;
      const getNextId = () => nextId++;

      const result = handleErrorMessage(history, 1, 'Network error', getNextId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(history[0]);
      expect(result[1]).toEqual({ id: 2, type: 'error', text: 'Error: Network error' });
    });

    it('replaces empty message with error', () => {
      const history: Message[] = [
        { id: 1, type: 'assistant', text: '' },
      ];
      let nextId = 2;
      const getNextId = () => nextId++;

      const result = handleErrorMessage(history, 1, 'Failed', getNextId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 2, type: 'error', text: 'Error: Failed' });
    });

    it('replaces whitespace-only message with error', () => {
      const history: Message[] = [
        { id: 1, type: 'assistant', text: '   ' },
      ];
      let nextId = 2;
      const getNextId = () => nextId++;

      const result = handleErrorMessage(history, 1, 'Error', getNextId);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });
  });

  describe('addUserMessage', () => {
    it('adds user message to history', () => {
      const history: Message[] = [];
      const result = addUserMessage(history, 1, 'Hello');

      expect(result).toEqual([{ id: 1, type: 'user', text: 'Hello' }]);
    });

    it('appends to existing history', () => {
      const history: Message[] = [{ id: 1, type: 'user', text: 'First' }];
      const result = addUserMessage(history, 2, 'Second');

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ id: 2, type: 'user', text: 'Second' });
    });
  });

  describe('addAssistantPlaceholder', () => {
    it('adds empty assistant message', () => {
      const history: Message[] = [];
      const result = addAssistantPlaceholder(history, 1);

      expect(result).toEqual([{ id: 1, type: 'assistant', text: '' }]);
    });
  });

  describe('addShellMessage', () => {
    it('adds shell output message', () => {
      const history: Message[] = [];
      const result = addShellMessage(history, 1, 'command output');

      expect(result).toEqual([{ id: 1, type: 'shell', text: 'command output' }]);
    });
  });

  describe('addErrorMessage', () => {
    it('adds error message', () => {
      const history: Message[] = [];
      const result = addErrorMessage(history, 1, 'Error occurred');

      expect(result).toEqual([{ id: 1, type: 'error', text: 'Error occurred' }]);
    });
  });

  describe('isBashCommand', () => {
    it('returns true for commands starting with !', () => {
      expect(isBashCommand('!ls')).toBe(true);
      expect(isBashCommand('!pwd')).toBe(true);
    });

    it('returns false for non-bash commands', () => {
      expect(isBashCommand('ls')).toBe(false);
      expect(isBashCommand('/help')).toBe(false);
      expect(isBashCommand('hello')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isBashCommand('')).toBe(false);
    });
  });

  describe('extractBashCommand', () => {
    it('extracts command without !', () => {
      expect(extractBashCommand('!ls -la')).toBe('ls -la');
      expect(extractBashCommand('!pwd')).toBe('pwd');
    });

    it('trims whitespace', () => {
      expect(extractBashCommand('!  ls  ')).toBe('ls');
    });

    it('handles command with no space after !', () => {
      expect(extractBashCommand('!ls')).toBe('ls');
    });
  });

  describe('shouldUpdateStreaming', () => {
    it('returns true when element fits in terminal', () => {
      expect(shouldUpdateStreaming(10, 24, 7)).toBe(true);
      expect(shouldUpdateStreaming(15, 30, 7)).toBe(true);
    });

    it('returns false when element too large', () => {
      expect(shouldUpdateStreaming(20, 24, 7)).toBe(false);
      expect(shouldUpdateStreaming(25, 30, 7)).toBe(false);
    });

    it('uses default margin of 7', () => {
      expect(shouldUpdateStreaming(16, 24)).toBe(true);
      expect(shouldUpdateStreaming(18, 24)).toBe(false);
    });

    it('handles custom margins', () => {
      expect(shouldUpdateStreaming(18, 24, 5)).toBe(true);
      expect(shouldUpdateStreaming(19, 24, 5)).toBe(false);
    });
  });

  describe('getCompletedHistory', () => {
    it('filters out streaming message', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'assistant', text: 'Streaming...' },
        { id: 3, type: 'user', text: 'World' },
      ];

      const result = getCompletedHistory(history, 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    it('returns all messages when no streaming', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'assistant', text: 'Response' },
      ];

      const result = getCompletedHistory(history, null);

      expect(result).toEqual(history);
    });
  });

  describe('getStreamingItem', () => {
    it('returns streaming message', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
        { id: 2, type: 'assistant', text: 'Streaming...' },
      ];

      const result = getStreamingItem(history, 2);

      expect(result).toEqual({ id: 2, type: 'assistant', text: 'Streaming...' });
    });

    it('returns undefined when no streaming', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
      ];

      const result = getStreamingItem(history, null);

      expect(result).toBeUndefined();
    });

    it('returns undefined when streaming ID not found', () => {
      const history: Message[] = [
        { id: 1, type: 'user', text: 'Hello' },
      ];

      const result = getStreamingItem(history, 999);

      expect(result).toBeUndefined();
    });
  });
});
