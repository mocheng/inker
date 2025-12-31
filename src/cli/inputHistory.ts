import fs from 'fs';
import path from 'path';
import os from 'os';

const HISTORY_FILE = path.join(os.homedir(), '.config', 'inker', 'input_history');
// Keep last 1000 input commands to prevent unbounded file growth
const MAX_HISTORY = 1000;

export function loadInputHistory(): string[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return content.split('\n').filter(line => line.trim());
    }
  } catch (error) {
    // Ignore errors
  }
  return [];
}

export function saveInputHistory(history: string[]): void {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const toSave = history.slice(-MAX_HISTORY);
    fs.writeFileSync(HISTORY_FILE, toSave.join('\n'), 'utf-8');
  } catch (error) {
    // Ignore errors
  }
}
