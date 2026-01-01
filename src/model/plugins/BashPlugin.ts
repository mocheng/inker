import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BashPlugin extends Plugin {
  getName(): string {
    return 'bash';
  }

  getDescription(): string {
    return 'Execute bash commands and return the output';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'command',
        type: 'string',
        description: 'The bash command to execute',
        required: true
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Executing: ${args.command}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    return `Executed: ${args.command}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(parameters.command);
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: true
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        success: false,
        exitCode: error.code
      };
    }
  }
}
