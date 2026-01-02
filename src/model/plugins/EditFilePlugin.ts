import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

export class EditFilePlugin extends Plugin {
  getName(): string {
    return 'edit_file';
  }

  getDescription(): string {
    return 'Edit a file by replacing a specific string with new content. The old_string must match exactly.';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'path',
        type: 'string',
        description: 'The path to the file to edit',
        required: true
      },
      {
        name: 'old_string',
        type: 'string',
        description: 'The exact string to search for and replace (must be unique in the file)',
        required: true
      },
      {
        name: 'new_string',
        type: 'string',
        description: 'The string to replace old_string with',
        required: true
      },
      {
        name: 'replace_all',
        type: 'boolean',
        description: 'Whether to replace all occurrences (default: false, only replaces first occurrence)',
        required: false
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Editing file: ${args.path}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Edited file: ${args.path} (${result.replacements} replacement${result.replacements !== 1 ? 's' : ''})`;
    }
    return `Failed to edit file: ${args.path}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const filePath = resolve(parameters.path);
      const content = await readFile(filePath, 'utf-8');
      const oldString = parameters.old_string;
      const newString = parameters.new_string;
      const replaceAll = parameters.replace_all ?? false;
      
      // Check if old_string exists in the file
      if (!content.includes(oldString)) {
        return {
          path: filePath,
          error: 'old_string not found in file',
          success: false
        };
      }
      
      // Count occurrences
      const occurrences = content.split(oldString).length - 1;
      
      // If not replace_all and there are multiple occurrences, warn
      if (!replaceAll && occurrences > 1) {
        return {
          path: filePath,
          error: `old_string found ${occurrences} times. Use replace_all: true to replace all, or provide a more unique string.`,
          success: false
        };
      }
      
      // Perform replacement
      let newContent: string;
      let replacements: number;
      
      if (replaceAll) {
        newContent = content.split(oldString).join(newString);
        replacements = occurrences;
      } else {
        newContent = content.replace(oldString, newString);
        replacements = 1;
      }
      
      await writeFile(filePath, newContent, 'utf-8');
      
      return {
        path: filePath,
        replacements,
        success: true
      };
    } catch (error: any) {
      return {
        path: parameters.path,
        error: error.message,
        success: false
      };
    }
  }
}
