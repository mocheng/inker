/**
 * Utility functions for App component
 */

/**
 * Filter commands based on input prefix
 */
export function filterCommands(input: string, allCommands: string[]): string[] {
  if (!input.startsWith('/')) {
    return [];
  }
  return allCommands.map(cmd => `/${cmd}`).filter(cmd => cmd.startsWith(input));
}

/**
 * Calculate next history index for navigation
 */
export function getNextHistoryIndex(
  direction: 'up' | 'down',
  currentIndex: number,
  historyLength: number
): number {
  if (direction === 'up') {
    const maxIndex = historyLength - 1;
    return currentIndex < maxIndex ? currentIndex + 1 : currentIndex;
  } else {
    // down
    if (currentIndex > 0) {
      return currentIndex - 1;
    } else if (currentIndex === 0) {
      return -1; // Reset to empty input
    }
    return currentIndex;
  }
}

/**
 * Get history item by index
 */
export function getHistoryItem(history: string[], index: number): string {
  if (index < 0 || history.length === 0) {
    return '';
  }
  return history[history.length - 1 - index] || '';
}

/**
 * Calculate next hint index for navigation
 */
export function getNextHintIndex(
  direction: 'up' | 'down',
  currentIndex: number,
  hintsLength: number
): number {
  if (hintsLength === 0) return currentIndex;
  
  if (direction === 'up') {
    return currentIndex > 0 ? currentIndex - 1 : hintsLength - 1;
  } else {
    return currentIndex < hintsLength - 1 ? currentIndex + 1 : 0;
  }
}

/**
 * Validate hint index is within bounds
 */
export function validateHintIndex(index: number, hintsLength: number): number {
  if (hintsLength === 0) return 0;
  if (index >= hintsLength) return 0;
  if (index < 0) return 0;
  return index;
}

/**
 * Calculate visible history height based on terminal size
 */
export function calculateVisibleHistoryHeight(
  terminalHeight: number,
  minMargin: number = 7
): number {
  return Math.max(1, terminalHeight - minMargin);
}
