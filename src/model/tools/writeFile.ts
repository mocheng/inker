import { Tool } from 'ai';
import { z } from 'zod';
import { writeFileSync } from 'fs';

export const writeFileTool: Tool = {
  description: 'Write content to a file',
  parameters: z.object({
    path: z.string().describe('The path to the file to write'),
    content: z.string().describe('The content to write to the file'),
  }),
  execute: async ({ path, content }) => {
    try {
      writeFileSync(path, content, 'utf-8');
      return { success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
};
