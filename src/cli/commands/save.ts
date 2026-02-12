import fs from 'fs';
import path from 'path';
import type { Command } from './types.js';
import { FileSystemError, formatErrorMessage } from '../errors/errorHandler.js';

export const saveCommand: Command = {
  name: 'save',
  description: 'Save chat history to a JSON file. Usage: /save [filename]',
  execute: (context) => {
    try {
      // Generate filename if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = context.args[0] || `inker-save-${timestamp}.json`;
      const filePath = path.resolve(filename);

      // Use setHistory callback to access current history
      context.setHistory((prevHistory) => {
        try {
          // Generate JSON content
          const content = JSON.stringify({
            timestamp: new Date().toISOString(),
            filename: filename,
            history: prevHistory,
          }, null, 2);

          // Write to file
          try {
            fs.writeFileSync(filePath, content, 'utf-8');
          } catch (writeError) {
            throw new FileSystemError(
              `Failed to write save file: ${filename}`,
              { error: writeError }
            );
          }

          // Add success message
          const id = context.getNextMessageId();
          const systemMessage = { 
            id, 
            type: 'system' as const, 
            text: `✓ Saved to ${filePath}` 
          };
          return [...prevHistory, systemMessage];
        } catch (error) {
          // Add error message if save fails
          const id = context.getNextMessageId();
          const errorMessage = {
            id,
            type: 'error' as const,
            text: `Save failed: ${formatErrorMessage(error)}`,
          };
          return [...prevHistory, errorMessage];
        }
      });
    } catch (error) {
      // This shouldn't normally happen as errors are handled in setHistory callback
      console.error('Unexpected error in save command:', error);
    }
  },
};
