import { Tool } from 'ai';
import { z } from 'zod';
import { readFileSync, writeFileSync } from 'fs';

export const editFileTool: Tool = {
  description: 'Edit a file by replacing a specific string with new content. The old_string must match exactly.',
  parameters: z.object({
    path: z.string().describe('The path to the file to edit'),
    old_string: z.string().describe('The exact string to search for and replace (must be unique in the file)'),
    new_string: z.string().describe('The string to replace old_string with'),
    replace_all: z.boolean().optional().describe('Whether to replace all occurrences (default: false)'),
  }),
  execute: async ({ path, old_string, new_string, replace_all = false }) => {
    try {
      const content = readFileSync(path, 'utf-8');
      if (!content.includes(old_string)) {
        return { error: 'old_string not found in file', success: false };
      }
      const occurrences = content.split(old_string).length - 1;
      if (!replace_all && occurrences > 1) {
        return { error: `old_string found ${occurrences} times. Use replace_all: true or provide a more unique string.`, success: false };
      }
      const newContent = replace_all ? content.replaceAll(old_string, new_string) : content.replace(old_string, new_string);
      writeFileSync(path, newContent, 'utf-8');
      return { success: true, replacements: replace_all ? occurrences : 1 };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
};
