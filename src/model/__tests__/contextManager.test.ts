import { describe, it, expect, beforeEach } from 'vitest';
import { getContextFiles, addContextFile, removeContextFile, clearContext } from '../contextManager.js';

describe('contextManager', () => {
  beforeEach(() => {
    clearContext();
  });

  describe('getContextFiles', () => {
    it('returns empty array initially', () => {
      expect(getContextFiles()).toEqual([]);
    });

    it('returns copy of context files', () => {
      addContextFile('/path/to/file.ts');
      const files1 = getContextFiles();
      const files2 = getContextFiles();
      
      expect(files1).toEqual(['/path/to/file.ts']);
      expect(files1).not.toBe(files2); // Different array instances
    });
  });

  describe('addContextFile', () => {
    it('adds a file to context', () => {
      addContextFile('/path/to/file.ts');
      expect(getContextFiles()).toEqual(['/path/to/file.ts']);
    });

    it('adds multiple files', () => {
      addContextFile('/file1.ts');
      addContextFile('/file2.ts');
      expect(getContextFiles()).toEqual(['/file1.ts', '/file2.ts']);
    });

    it('does not add duplicate files', () => {
      addContextFile('/file.ts');
      addContextFile('/file.ts');
      expect(getContextFiles()).toEqual(['/file.ts']);
    });
  });

  describe('removeContextFile', () => {
    it('removes a file from context', () => {
      addContextFile('/file1.ts');
      addContextFile('/file2.ts');
      
      removeContextFile('/file1.ts');
      
      expect(getContextFiles()).toEqual(['/file2.ts']);
    });

    it('does nothing if file not in context', () => {
      addContextFile('/file1.ts');
      
      removeContextFile('/nonexistent.ts');
      
      expect(getContextFiles()).toEqual(['/file1.ts']);
    });

    it('handles removing from empty context', () => {
      removeContextFile('/file.ts');
      expect(getContextFiles()).toEqual([]);
    });
  });

  describe('clearContext', () => {
    it('clears all files from context', () => {
      addContextFile('/file1.ts');
      addContextFile('/file2.ts');
      addContextFile('/file3.ts');
      
      clearContext();
      
      expect(getContextFiles()).toEqual([]);
    });

    it('handles clearing empty context', () => {
      clearContext();
      expect(getContextFiles()).toEqual([]);
    });
  });
});
