import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { loadInputHistory, saveInputHistory } from '../inputHistory.js';

vi.mock('fs');

describe('inputHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadInputHistory', () => {
    it('returns empty array when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(loadInputHistory()).toEqual([]);
    });

    it('loads and returns history from file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('command1\ncommand2\ncommand3');
      expect(loadInputHistory()).toEqual(['command1', 'command2', 'command3']);
    });

    it('filters out empty lines', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('command1\n\n  \ncommand2');
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(loadInputHistory()).toEqual(['command1', 'command2']);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('filters out very long entries', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const longEntry = 'a'.repeat(10001);
      vi.mocked(fs.readFileSync).mockReturnValue(`command1\n${longEntry}\ncommand2`);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(loadInputHistory()).toEqual(['command1', 'command2']);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('returns empty array on read error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(loadInputHistory()).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('saveInputHistory', () => {
    it('creates directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      
      saveInputHistory(['command1']);
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('saves history to file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      
      saveInputHistory(['command1', 'command2']);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        'command1\ncommand2',
        'utf-8'
      );
    });

    it('sanitizes history before saving', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      
      saveInputHistory(['command1', '', '  ', 'command2']);
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        'command1\ncommand2',
        'utf-8'
      );
    });

    it('handles non-array input', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      saveInputHistory('not an array' as any);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: History must be an array');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('handles write errors', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      saveInputHistory(['command1']);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
