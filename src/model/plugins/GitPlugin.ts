import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitPlugin extends Plugin {
  getName(): string {
    return 'git';
  }

  getDescription(): string {
    return 'Execute git commands and return the output';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'args',
        type: 'string',
        description: 'The git command arguments (e.g., "status", "log --oneline -5", "diff HEAD~1")',
        required: true
      },
      {
        name: 'cwd',
        type: 'string',
        description: 'Optional working directory to run the git command in',
        required: false
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Running: git ${args.args}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Completed: git ${args.args}`;
    }
    return `Failed: git ${args.args}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const command = `git ${parameters.args}`;
      const options: { cwd?: string } = {};
      
      if (parameters.cwd) {
        options.cwd = parameters.cwd;
      }
      
      const { stdout, stderr } = await execAsync(command, options);
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
