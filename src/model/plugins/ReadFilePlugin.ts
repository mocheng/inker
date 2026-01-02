import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export class ReadFilePlugin extends Plugin {
  getName(): string {
    return 'read_file';
  }

  getDescription(): string {
    return 'Read the contents of a file from the filesystem';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'path',
        type: 'string',
        description: 'The path to the file to read (absolute or relative to current working directory)',
        required: true
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Reading file: ${args.path}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Read file: ${args.path} (${result.size} bytes)`;
    }
    return `Failed to read file: ${args.path}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const filePath = resolve(parameters.path);
      const content = await readFile(filePath, 'utf-8');
      
      return {
        content,
        path: filePath,
        size: content.length,
        success: true
      };
    } catch (error: any) {
      return {
        content: '',
        path: parameters.path,
        error: error.message,
        success: false
      };
    }
  }
}
