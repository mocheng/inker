/**
 * Input handling utilities for App component
 */

/**
 * Check if input should show command hints
 */
export function shouldShowHints(input: string): boolean {
  return input.startsWith('/');
}

/**
 * Check if we should prevent submission after hint selection
 */
export function shouldPreventSubmit(
  justSelectedHint: boolean,
  input: string,
  isLoading: boolean
): boolean {
  if (justSelectedHint) {
    return true;
  }
  if (!input.trim() || isLoading) {
    return true;
  }
  return false;
}

/**
 * Reset input state after command execution
 */
export function getResetInputState() {
  return {
    input: '',
    showHints: false,
    selectedHintIndex: 0,
  };
}

/**
 * Update input history after submission
 */
export function addToInputHistory(history: string[], newInput: string): string[] {
  return [...history, newInput];
}

/**
 * Check if input is a command (starts with /)
 */
export function isCommand(input: string): boolean {
  return input.trim().startsWith('/');
}
