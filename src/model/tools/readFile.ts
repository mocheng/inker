import { CoreTool } from 'ai';
import { z } from 'zod';
import { readFileSync } from 'fs';

export const readFileTool: CoreTool = {
  description: 'Read the contents of a file',
  parameters: z.object({
    path: z.string().describe('The path to the file to read'),
  }),
  execute: async ({ path }) => {
    try {
      const content = readFileSync(path, 'utf-8');
      return { content, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
};
