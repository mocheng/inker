import { Tool } from 'ai';
import { z } from 'zod';
import { readdirSync, statSync } from 'fs';

export const listDirectoryTool: Tool = {
  description: 'List the contents of a directory',
  parameters: z.object({
    path: z.string().describe('The path to the directory to list'),
  }),
  execute: async ({ path }) => {
    try {
      const entries = readdirSync(path).map(name => {
        const fullPath = `${path}/${name}`;
        const stats = statSync(fullPath);
        return { name, isDirectory: stats.isDirectory(), size: stats.size };
      });
      return { entries, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
};
