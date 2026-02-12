/**
 * Error handling utilities for Inker
 * Provides consistent error formatting and user-friendly error messages
 */

/**
 * Custom error types for better error categorization
 */
export class InkerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'InkerError';
  }
}

export class ConfigError extends InkerError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

export class FileSystemError extends InkerError {
  constructor(message: string, details?: unknown) {
    super(message, 'FILESYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}

export class CommandError extends InkerError {
  constructor(message: string, details?: unknown) {
    super(message, 'COMMAND_ERROR', details);
    this.name = 'CommandError';
  }
}

export class NetworkError extends InkerError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * Format errors for display to the user
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof InkerError) {
    // Our custom errors are already user-friendly
    return error.message;
  }

  if (error instanceof Error) {
    // Standard JavaScript errors
    return error.message;
  }

  // Fallback for unknown error types
  return `Unknown error: ${String(error)}`;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    // Common retryable network errors
    const retryableMessages = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'network error',
      'timeout',
    ];
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  return false;
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = context 
      ? `${context} failed: ${formatErrorMessage(error)}`
      : formatErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Log error details (useful for debugging)
 */
export function logError(error: unknown, context?: string): void {
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }

  // Log stack trace for unhandled errors in development
  if (error instanceof Error && error.stack && process.env.NODE_ENV === 'development') {
    console.error(error.stack);
  }
}
