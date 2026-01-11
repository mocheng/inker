import { CoreTool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const bashTool: CoreTool = {
  description: 'Execute bash commands and return the output',
  parameters: z.object({
    command: z.string().describe('The bash command to execute'),
  }),
  execute: async ({ command }) => {
    try {
      const { stdout, stderr } = await execAsync(command);
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
