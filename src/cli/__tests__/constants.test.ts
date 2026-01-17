import { describe, it, expect } from 'vitest';
import {
  INKER_ASCII_ART,
  MIN_TERMINAL_MARGIN,
  DEFAULT_TERMINAL_HEIGHT,
  BASH_COMMAND_PREFIX,
  COMMAND_PREFIX,
  HINT_SELECTION_DELAY,
  MAX_EXEC_BUFFER,
} from '../constants.js';

describe('constants', () => {
  it('exports INKER_ASCII_ART', () => {
    expect(INKER_ASCII_ART).toBeTruthy();
    expect(INKER_ASCII_ART).toContain('██');
  });

  it('exports MIN_TERMINAL_MARGIN', () => {
    expect(MIN_TERMINAL_MARGIN).toBe(7);
  });

  it('exports DEFAULT_TERMINAL_HEIGHT', () => {
    expect(DEFAULT_TERMINAL_HEIGHT).toBe(24);
  });

  it('exports BASH_COMMAND_PREFIX', () => {
    expect(BASH_COMMAND_PREFIX).toBe('!');
  });

  it('exports COMMAND_PREFIX', () => {
    expect(COMMAND_PREFIX).toBe('/');
  });

  it('exports HINT_SELECTION_DELAY', () => {
    expect(HINT_SELECTION_DELAY).toBe(100);
  });

  it('exports MAX_EXEC_BUFFER', () => {
    expect(MAX_EXEC_BUFFER).toBe(10 * 1024 * 1024);
  });
});
