import fs from 'fs';
import path from 'path';
import os from 'os';

const HISTORY_FILE = path.join(os.homedir(), '.config', 'inker', 'input_history');
// Keep last 1000 input commands to prevent unbounded file growth
const MAX_HISTORY = 1000;

function isValidHistoryEntry(entry: string): boolean {
  // Filter out empty strings and very long entries (potential corruption)
  return entry.trim().length > 0 && entry.length < 10000;
}

function sanitizeHistory(history: string[]): string[] {
  return history
    .filter(isValidHistoryEntry)
    .slice(-MAX_HISTORY); // Ensure we don't exceed max even if file was corrupted
}

export function loadInputHistory(): string[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const lines = content.split('\n');
    const validLines = sanitizeHistory(lines);
    
    if (validLines.length !== lines.length) {
      // Some entries were filtered out, log a warning
      console.warn(`Warning: Filtered out ${lines.length - validLines.length} invalid history entries`);
    }
    
    return validLines;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error loading input history from ${HISTORY_FILE}: ${errorMessage}`);
    return [];
  }
}

export function saveInputHistory(history: string[]): void {
  try {
    if (!Array.isArray(history)) {
      console.error('Error: History must be an array');
      return;
    }

    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const sanitized = sanitizeHistory(history);
    const content = sanitized.join('\n');
    
    fs.writeFileSync(HISTORY_FILE, content, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error saving input history to ${HISTORY_FILE}: ${errorMessage}`);
  }
}
