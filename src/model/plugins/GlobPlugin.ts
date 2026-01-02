import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

export class GlobPlugin extends Plugin {
  getName(): string {
    return 'glob';
  }

  getDescription(): string {
    return 'Find files matching a glob pattern';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'pattern',
        type: 'string',
        description: 'The glob pattern to match files (e.g., "**/*.ts", "src/**/*.test.js")',
        required: true
      },
      {
        name: 'path',
        type: 'string',
        description: 'The directory to search in (default: current directory)',
        required: false
      },
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of results to return (default: 100)',
        required: false
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Finding files: ${args.pattern}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Found ${result.files.length} files matching: ${args.pattern}`;
    }
    return `Failed to find files: ${args.pattern}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const searchPath = parameters.path ? resolve(parameters.path) : '.';
      const maxResults = parameters.max_results ?? 100;
      const pattern = parameters.pattern;
      
      // Use fd if available, fallback to find
      // fd is faster and respects .gitignore by default
      let command: string;
      
      try {
        // Check if fd is available
        await execAsync('which fd');
        command = `fd --type f --glob '${pattern}' '${searchPath}' | head -n ${maxResults}`;
      } catch {
        // Fallback to find with some common exclusions
        const findPattern = pattern.replace(/\*\*/g, '*');
        command = `find '${searchPath}' -type f -name '${findPattern}' ! -path '*/node_modules/*' ! -path '*/.git/*' 2>/dev/null | head -n ${maxResults}`;
      }
      
      const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      
      const files = stdout
        .trim()
        .split('\n')
        .filter(line => line)
        .slice(0, maxResults);
      
      return {
        files,
        count: files.length,
        success: true
      };
    } catch (error: any) {
      // Empty result is not an error
      if (!error.stdout && !error.stderr) {
        return {
          files: [],
          count: 0,
          success: true
        };
      }
      
      return {
        files: [],
        count: 0,
        error: error.message,
        success: false
      };
    }
  }
}
