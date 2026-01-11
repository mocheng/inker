import { Tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const globTool: Tool = {
  description: 'Find files matching a glob pattern',
  inputSchema: z.object({
    pattern: z.string().describe('The glob pattern to match files (e.g., "**/*.ts")'),
    path: z.string().optional().describe('The directory to search in (default: current directory)'),
    max_results: z.number().optional().describe('Maximum number of results to return (default: 100)'),
  }),
  execute: async ({ pattern, path = '.', max_results = 100 }) => {
    try {
      const command = `fd --type f "${pattern}" ${path} | head -n ${max_results}`;
      const { stdout } = await execAsync(command);
      const files = stdout.trim().split('\n').filter(f => f);
      return { files, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
};
