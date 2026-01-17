import { describe, it, expect } from 'vitest';
import {
  filterCommands,
  getNextHistoryIndex,
  getHistoryItem,
  getNextHintIndex,
  validateHintIndex,
  calculateVisibleHistoryHeight,
} from '../appUtils.js';

describe('appUtils', () => {
  describe('filterCommands', () => {
    it('returns empty array for non-command input', () => {
      expect(filterCommands('hello', ['help', 'quit'])).toEqual([]);
    });

    it('filters commands by prefix', () => {
      const commands = ['help', 'history', 'quit'];
      expect(filterCommands('/h', commands)).toEqual(['/help', '/history']);
    });

    it('returns all commands for / prefix', () => {
      const commands = ['help', 'quit'];
      expect(filterCommands('/', commands)).toEqual(['/help', '/quit']);
    });

    it('returns empty for no matches', () => {
      expect(filterCommands('/xyz', ['help', 'quit'])).toEqual([]);
    });

    it('handles empty command list', () => {
      expect(filterCommands('/h', [])).toEqual([]);
    });
  });

  describe('getNextHistoryIndex', () => {
    it('increments index on up navigation', () => {
      expect(getNextHistoryIndex('up', 0, 5)).toBe(1);
      expect(getNextHistoryIndex('up', 2, 5)).toBe(3);
    });

    it('stops at max index on up navigation', () => {
      expect(getNextHistoryIndex('up', 4, 5)).toBe(4);
    });

    it('decrements index on down navigation', () => {
      expect(getNextHistoryIndex('down', 3, 5)).toBe(2);
      expect(getNextHistoryIndex('down', 1, 5)).toBe(0);
    });

    it('resets to -1 when at index 0 on down', () => {
      expect(getNextHistoryIndex('down', 0, 5)).toBe(-1);
    });

    it('stays at -1 when already at -1 on down', () => {
      expect(getNextHistoryIndex('down', -1, 5)).toBe(-1);
    });

    it('handles empty history', () => {
      expect(getNextHistoryIndex('up', -1, 0)).toBe(-1);
      expect(getNextHistoryIndex('down', -1, 0)).toBe(-1);
    });
  });

  describe('getHistoryItem', () => {
    const history = ['first', 'second', 'third'];

    it('returns item from end of history', () => {
      expect(getHistoryItem(history, 0)).toBe('third');
      expect(getHistoryItem(history, 1)).toBe('second');
      expect(getHistoryItem(history, 2)).toBe('first');
    });

    it('returns empty string for negative index', () => {
      expect(getHistoryItem(history, -1)).toBe('');
    });

    it('returns empty string for out of bounds index', () => {
      expect(getHistoryItem(history, 10)).toBe('');
    });

    it('returns empty string for empty history', () => {
      expect(getHistoryItem([], 0)).toBe('');
    });
  });

  describe('getNextHintIndex', () => {
    it('decrements index on up navigation', () => {
      expect(getNextHintIndex('up', 2, 5)).toBe(1);
      expect(getNextHintIndex('up', 1, 5)).toBe(0);
    });

    it('wraps to end on up from 0', () => {
      expect(getNextHintIndex('up', 0, 5)).toBe(4);
    });

    it('increments index on down navigation', () => {
      expect(getNextHintIndex('down', 0, 5)).toBe(1);
      expect(getNextHintIndex('down', 2, 5)).toBe(3);
    });

    it('wraps to 0 on down from last', () => {
      expect(getNextHintIndex('down', 4, 5)).toBe(0);
    });

    it('returns current index for empty hints', () => {
      expect(getNextHintIndex('up', 0, 0)).toBe(0);
      expect(getNextHintIndex('down', 0, 0)).toBe(0);
    });
  });

  describe('validateHintIndex', () => {
    it('returns index if within bounds', () => {
      expect(validateHintIndex(2, 5)).toBe(2);
      expect(validateHintIndex(0, 5)).toBe(0);
      expect(validateHintIndex(4, 5)).toBe(4);
    });

    it('returns 0 if index >= length', () => {
      expect(validateHintIndex(5, 5)).toBe(0);
      expect(validateHintIndex(10, 5)).toBe(0);
    });

    it('returns 0 if index < 0', () => {
      expect(validateHintIndex(-1, 5)).toBe(0);
      expect(validateHintIndex(-10, 5)).toBe(0);
    });

    it('returns 0 for empty hints', () => {
      expect(validateHintIndex(0, 0)).toBe(0);
      expect(validateHintIndex(5, 0)).toBe(0);
    });
  });

  describe('calculateVisibleHistoryHeight', () => {
    it('calculates height with default margin', () => {
      expect(calculateVisibleHistoryHeight(24)).toBe(17);
      expect(calculateVisibleHistoryHeight(30)).toBe(23);
    });

    it('calculates height with custom margin', () => {
      expect(calculateVisibleHistoryHeight(24, 10)).toBe(14);
      expect(calculateVisibleHistoryHeight(30, 5)).toBe(25);
    });

    it('returns minimum of 1', () => {
      expect(calculateVisibleHistoryHeight(5, 10)).toBe(1);
      expect(calculateVisibleHistoryHeight(1, 7)).toBe(1);
    });

    it('handles large terminal heights', () => {
      expect(calculateVisibleHistoryHeight(100)).toBe(93);
    });
  });
});
