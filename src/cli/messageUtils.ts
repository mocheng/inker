/**
 * Message handling logic for App component
 */
import type { Message } from './types.js';

/**
 * Update a streaming message in history
 */
export function updateStreamingMessage(
  history: Message[],
  responseId: number,
  text: string
): Message[] {
  return history.map(item =>
    item.id === responseId ? { ...item, text } : item
  );
}

/**
 * Handle error by either appending or replacing message
 */
export function handleErrorMessage(
  history: Message[],
  responseId: number,
  errorMsg: string,
  getNextId: () => number
): Message[] {
  const streamingItem = history.find(item => item.id === responseId);
  const hasPartialContent = streamingItem && streamingItem.text.trim().length > 0;

  if (hasPartialContent) {
    // Keep partial content and append error as a new message
    return [
      ...history,
      { id: getNextId(), type: 'error', text: `Error: ${errorMsg}` }
    ];
  } else {
    // No partial content, replace empty response with error
    return history
      .filter(item => item.id !== responseId)
      .concat({ id: getNextId(), type: 'error', text: `Error: ${errorMsg}` });
  }
}

/**
 * Add user message to history
 */
export function addUserMessage(
  history: Message[],
  messageId: number,
  text: string
): Message[] {
  return [...history, { id: messageId, type: 'user', text }];
}

/**
 * Add assistant message placeholder to history
 */
export function addAssistantPlaceholder(
  history: Message[],
  messageId: number
): Message[] {
  return [...history, { id: messageId, type: 'assistant', text: '' }];
}

/**
 * Add shell output message to history
 */
export function addShellMessage(
  history: Message[],
  messageId: number,
  output: string
): Message[] {
  return [...history, { id: messageId, type: 'shell', text: output }];
}

/**
 * Add error message to history
 */
export function addErrorMessage(
  history: Message[],
  messageId: number,
  error: string
): Message[] {
  return [...history, { id: messageId, type: 'error', text: error }];
}

/**
 * Add system message to history
 */
export function addSystemMessage(
  history: Message[],
  messageId: number,
  text: string
): Message[] {
  return [...history, { id: messageId, type: 'system', text }];
}

/**
 * Check if input is a bash command
 */
export function isBashCommand(input: string): boolean {
  return input.startsWith('!');
}

/**
 * Extract bash command from input
 */
export function extractBashCommand(input: string): string {
  return input.slice(1).trim();
}

/**
 * Check if element should update during streaming
 */
export function shouldUpdateStreaming(
  elementHeight: number,
  terminalHeight: number,
  minMargin: number = 7
): boolean {
  return elementHeight < terminalHeight - minMargin;
}

/**
 * Filter completed history (non-streaming items)
 */
export function getCompletedHistory(
  history: Message[],
  streamingId: number | null
): Message[] {
  return history.filter(item => item.id !== streamingId);
}

/**
 * Get streaming item from history
 */
export function getStreamingItem(
  history: Message[],
  streamingId: number | null
): Message | undefined {
  if (streamingId === null) return undefined;
  return history.find(item => item.id === streamingId);
}
