import { describe, it, expect } from 'vitest';
import {
  InkerError,
  ConfigError,
  FileSystemError,
  CommandError,
  NetworkError,
  formatErrorMessage,
  isRetryableError,
  withErrorHandling,
  logError,
} from '../errorHandler.js';

describe('Error Types', () => {
  it('InkerError has correct properties', () => {
    const error = new InkerError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('InkerError');
  });

  it('ConfigError has correct name and code', () => {
    const error = new ConfigError('Missing config');
    expect(error.name).toBe('ConfigError');
    expect(error.code).toBe('CONFIG_ERROR');
    expect(error.message).toBe('Missing config');
  });

  it('FileSystemError has correct name and code', () => {
    const error = new FileSystemError('File not found');
    expect(error.name).toBe('FileSystemError');
    expect(error.code).toBe('FILESYSTEM_ERROR');
  });

  it('CommandError has correct name and code', () => {
    const error = new CommandError('Invalid command');
    expect(error.name).toBe('CommandError');
    expect(error.code).toBe('COMMAND_ERROR');
  });

  it('NetworkError has correct name and code', () => {
    const error = new NetworkError('Connection failed');
    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe('NETWORK_ERROR');
  });
});

describe('formatErrorMessage', () => {
  it(' formats InkerError correctly', () => {
    const error = new InkerError('Custom error', 'CUSTOM_CODE');
    expect(formatErrorMessage(error)).toBe('Custom error');
  });

  it('formats standard Error correctly', () => {
    const error = new Error('Standard error');
    expect(formatErrorMessage(error)).toBe('Standard error');
  });

  it('handles unknown error types', () => {
    expect(formatErrorMessage('string error')).toBe('Unknown error: string error');
    expect(formatErrorMessage(123)).toBe('Unknown error: 123');
  });
});

describe('isRetryableError', () => {
  it('returns true for NetworkError', () => {
    const error = new NetworkError('Connection failed');
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for standard network errors', () => {
    expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
    expect(isRetryableError(new Error('network error'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isRetryableError(new Error('Some random error'))).toBe(false);
    expect(isRetryableError(new InkerError('Custom error', 'CUSTOM_CODE'))).toBe(false);
  });
});

describe('withErrorHandling', () => {
  it('wraps successful async functions', async () => {
    const result = await withErrorHandling(async () => 'success');
    expect(result).toBe('success');
  });

  it('wraps failed async functions with context', async () => {
    await expect(
      withErrorHandling(async () => {
        throw new Error('Test error');
      }, 'Operation')
    ).rejects.toThrow('Operation failed: Test error');
  });

  it('wraps failed async functions without context', async () => {
    await expect(
      withErrorHandling(async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');
  });
});

describe('logError', () => {
  it('logs error with context', () => {
    const consoleSpy = global.console.error;
    consoleSpy.mockImplementation(() => {});
    const error = new Error('Test error');
    logError(error, 'TestContext');
    consoleSpy.mockRestore();
  });

  it('logs error without context', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');
    logError(error);
    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });
});
