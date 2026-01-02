import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

export class GrepPlugin extends Plugin {
  getName(): string {
    return 'grep';
  }

  getDescription(): string {
    return 'Search for a pattern in files using ripgrep (rg). Returns matching lines with file paths and line numbers.';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'pattern',
        type: 'string',
        description: 'The regex pattern to search for',
        required: true
      },
      {
        name: 'path',
        type: 'string',
        description: 'The directory or file to search in (default: current directory)',
        required: false
      },
      {
        name: 'file_pattern',
        type: 'string',
        description: 'Glob pattern to filter files (e.g., "*.ts", "*.{js,jsx}")',
        required: false
      },
      {
        name: 'case_insensitive',
        type: 'boolean',
        description: 'Whether to search case-insensitively (default: false)',
        required: false
      },
      {
        name: 'max_results',
        type: 'number',
        description: 'Maximum number of results to return (default: 50)',
        required: false
      },
      {
        name: 'context_lines',
        type: 'number',
        description: 'Number of context lines before and after each match (default: 0)',
        required: false
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Searching for: ${args.pattern}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Found ${result.match_count} matches for: ${args.pattern}`;
    }
    return `Search failed for: ${args.pattern}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const searchPath = parameters.path ? resolve(parameters.path) : '.';
      const maxResults = parameters.max_results ?? 50;
      const contextLines = parameters.context_lines ?? 0;
      
      // Build ripgrep command
      let command = 'rg';
      command += ' --line-number';
      command += ' --no-heading';
      command += ' --color=never';
      
      if (parameters.case_insensitive) {
        command += ' --ignore-case';
      }
      
      if (parameters.file_pattern) {
        command += ` --glob '${parameters.file_pattern}'`;
      }
      
      if (contextLines > 0) {
        command += ` --context ${contextLines}`;
      }
      
      command += ` --max-count ${maxResults}`;
      command += ` -- '${parameters.pattern.replace(/'/g, "'\\''")}'`;
      command += ` '${searchPath}'`;
      
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      
      const lines = stdout.trim().split('\n').filter(line => line);
      const matches: any[] = [];
      
      for (const line of lines.slice(0, maxResults)) {
        // Parse ripgrep output: file:line:content or file-line-content (for context)
        const match = line.match(/^(.+?):(\d+):(.*)$/) || line.match(/^(.+?)-(\d+)-(.*)$/);
        if (match) {
          matches.push({
            file: match[1],
            line: parseInt(match[2], 10),
            content: match[3]
          });
        }
      }
      
      return {
        matches,
        match_count: matches.length,
        success: true
      };
    } catch (error: any) {
      // ripgrep returns exit code 1 when no matches found
      if (error.code === 1 && !error.stderr) {
        return {
          matches: [],
          match_count: 0,
          success: true
        };
      }
      
      return {
        matches: [],
        match_count: 0,
        error: error.stderr || error.message,
        success: false
      };
    }
  }
}
