import fs from 'fs';
import path from 'path';
import type { Command } from './types.js';
import { FileSystemError, formatErrorMessage } from '../errors/errorHandler.js';

export const exportCommand: Command = {
  name: 'export',
  description: 'Export chat history to a markdown file. Usage: /export [filename]',
  execute: (context) => {
    try {
      // Generate filename if not provided
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = context.args[0] || `inker-export-${timestamp}.md`;
      const filePath = path.resolve(filename);

      // Use setHistory callback to access current history
      context.setHistory((prevHistory) => {
        try {
          // Generate markdown content
          let mdContent = generateExportMarkdown(prevHistory, filename);

          // Write to file
          try {
            fs.writeFileSync(filePath, mdContent, 'utf-8');
          } catch (writeError) {
            throw new FileSystemError(
              `Failed to write export file: ${filename}`,
              { error: writeError }
            );
          }

          // Add success message
          const id = context.getNextMessageId();
          const systemMessage = { 
            id, 
            type: 'system' as const, 
            text: `✓ Exported to ${filePath}` 
          };
          return [...prevHistory, systemMessage];
        } catch (error) {
          // Add error message if export fails
          const id = context.getNextMessageId();
          const errorMessage = {
            id,
            type: 'error' as const,
            text: `Export failed: ${formatErrorMessage(error)}`,
          };
          return [...prevHistory, errorMessage];
        }
      });
    } catch (error) {
      // This shouldn't normally happen as errors are handled in setHistory callback
      console.error('Unexpected error in export command:', error);
    }
  },
};

function generateExportMarkdown(history: any[], filename: string): string {
  let mdContent = `# Inker Chat Export\n\n`;
  mdContent += `Generated: ${new Date().toISOString()}\n`;
  mdContent += `Filename: ${filename}\n\n`;
  mdContent += `---\n\n`;

  for (const msg of history) {
    const typeHeaders: Record<string, string> = {
      user: '## 👤 User',
      assistant: '## 🤖 Assistant',
      system: '## ⚙️ System',
      error: '## ❌ Error',
      shell: '## 💻 Shell Output',
    };

    mdContent += `${typeHeaders[msg.type] || '## Unknown'}\n\n`;
    mdContent += `${msg.text}\n\n`;
    mdContent += `---\n\n`;
  }

  return mdContent;
}
