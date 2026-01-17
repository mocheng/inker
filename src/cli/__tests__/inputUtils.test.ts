import { describe, it, expect } from 'vitest';
import {
  shouldShowHints,
  shouldPreventSubmit,
  getResetInputState,
  addToInputHistory,
  isCommand,
} from '../inputUtils.js';

describe('inputUtils', () => {
  describe('shouldShowHints', () => {
    it('returns true for input starting with /', () => {
      expect(shouldShowHints('/help')).toBe(true);
      expect(shouldShowHints('/')).toBe(true);
      expect(shouldShowHints('/quit')).toBe(true);
    });

    it('returns false for non-command input', () => {
      expect(shouldShowHints('hello')).toBe(false);
      expect(shouldShowHints('!ls')).toBe(false);
      expect(shouldShowHints('')).toBe(false);
    });
  });

  describe('shouldPreventSubmit', () => {
    it('prevents submit when hint just selected', () => {
      expect(shouldPreventSubmit(true, 'input', false)).toBe(true);
    });

    it('prevents submit when input is empty', () => {
      expect(shouldPreventSubmit(false, '', false)).toBe(true);
      expect(shouldPreventSubmit(false, '   ', false)).toBe(true);
    });

    it('prevents submit when loading', () => {
      expect(shouldPreventSubmit(false, 'input', true)).toBe(true);
    });

    it('allows submit when conditions are met', () => {
      expect(shouldPreventSubmit(false, 'input', false)).toBe(false);
    });
  });

  describe('getResetInputState', () => {
    it('returns reset state object', () => {
      const state = getResetInputState();
      expect(state).toEqual({
        input: '',
        showHints: false,
        selectedHintIndex: 0,
      });
    });
  });

  describe('addToInputHistory', () => {
    it('adds input to history', () => {
      const history = ['first', 'second'];
      const result = addToInputHistory(history, 'third');
      expect(result).toEqual(['first', 'second', 'third']);
    });

    it('handles empty history', () => {
      const result = addToInputHistory([], 'first');
      expect(result).toEqual(['first']);
    });

    it('does not mutate original array', () => {
      const history = ['first'];
      const result = addToInputHistory(history, 'second');
      expect(history).toEqual(['first']);
      expect(result).toEqual(['first', 'second']);
    });
  });

  describe('isCommand', () => {
    it('returns true for commands starting with /', () => {
      expect(isCommand('/help')).toBe(true);
      expect(isCommand('/quit')).toBe(true);
      expect(isCommand('  /help  ')).toBe(true);
    });

    it('returns false for non-commands', () => {
      expect(isCommand('hello')).toBe(false);
      expect(isCommand('!ls')).toBe(false);
      expect(isCommand('')).toBe(false);
    });
  });
});
