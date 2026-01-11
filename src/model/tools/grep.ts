import { Tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const grepTool: Tool = {
  description: 'Search for a pattern in files using ripgrep (rg). Returns matching lines with file paths and line numbers.',
  inputSchema: z.object({
    pattern: z.string().describe('The regex pattern to search for'),
    path: z.string().optional().describe('The directory or file to search in (default: current directory)'),
    file_pattern: z.string().optional().describe('Glob pattern to filter files (e.g., "*.ts")'),
    case_insensitive: z.boolean().optional().describe('Whether to search case-insensitively'),
    max_results: z.number().optional().describe('Maximum number of results to return (default: 50)'),
    context_lines: z.number().optional().describe('Number of context lines before and after each match'),
  }),
  execute: async ({ pattern, path = '.', file_pattern, case_insensitive, max_results = 50, context_lines = 0 }) => {
    try {
      let command = `rg --json ${case_insensitive ? '-i' : ''} ${context_lines > 0 ? `-C ${context_lines}` : ''} ${file_pattern ? `-g "${file_pattern}"` : ''} "${pattern}" ${path}`;
      const { stdout } = await execAsync(command);
      const lines = stdout.trim().split('\n').slice(0, max_results);
      return { results: lines, success: true };
    } catch (error: any) {
      return { results: [], success: true }; // No matches is not an error
    }
  },
};
