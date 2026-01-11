import { Tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const gitTool: Tool = {
  description: 'Execute git commands and return the output',
  parameters: z.object({
    args: z.string().describe('The git command arguments (e.g., "status", "log --oneline -5")'),
    cwd: z.string().optional().describe('Optional working directory to run the git command in'),
  }),
  execute: async ({ args, cwd }) => {
    try {
      const command = `git ${args}`;
      const options = cwd ? { cwd } : {};
      const { stdout, stderr } = await execAsync(command, options);
      return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    } catch (error: any) {
      return {
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        success: false,
        exitCode: error.code
      };
    }
  },
};
