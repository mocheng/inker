/**
 * Confirmation dialog for dangerous operations
 * Provides a simple yes/no confirmation mechanism
 */

import type { CommandContext } from './commands/types.js';

/**
 * Confirmation state
 */
export interface ConfirmationState {
  show: boolean;
  prompt: string;
  onConfirm: () => void;
  onCancel: () => void;
  context?: CommandContext;
}

let currentConfirmation: ConfirmationState | null = null;

/**
 * Request user confirmation for a dangerous operation
 */
export function requestConfirmation(
  prompt: string,
  onConfirm: () => void,
  onCancel: () => void
): void {
  currentConfirmation = {
    show: true,
    prompt,
    onConfirm,
    onCancel,
  };
}

/**
 * Get current confirmation state
 */
export function getCurrentConfirmation(): ConfirmationState | null {
  return currentConfirmation;
}

/**
 * Clear current confirmation
 */
export function clearConfirmation(): void {
  currentConfirmation = null;
}

/**
 * Render confirmation prompt text
 */
export function renderConfirmationPromptText(): string | null {
  if (!currentConfirmation || !currentConfirmation.show) {
    return null;
  }

  return `${currentConfirmation.prompt} (y/n): `;
}

/**
 * Handle confirmation response
 */
export function handleConfirmation(response: string): boolean {
  if (!currentConfirmation) {
    return false;
  }

  const normalized = response.toLowerCase().trim();
  
  if (normalized === 'y' || normalized === 'yes') {
    currentConfirmation.onConfirm();
    clearConfirmation();
    return true;
  } else if (normalized === 'n' || normalized === 'no') {
    currentConfirmation.onCancel();
    clearConfirmation();
    return true;
  }
  
  return false; // Invalid response
}

/**
 * Helper to create a danger command confirmation
 */
export function confirmDangerousCommand(
  command: string,
  warning: string,
  execute: () => void,
  cancel: () => void
): void {
  const prompt = `${warning}\n→ Command: ${command}\nProceed?`;
  requestConfirmation(prompt, execute, cancel);
}
