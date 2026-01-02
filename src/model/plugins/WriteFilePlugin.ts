import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';

export class WriteFilePlugin extends Plugin {
  getName(): string {
    return 'write_file';
  }

  getDescription(): string {
    return 'Write content to a file, creating the file and parent directories if they do not exist';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'path',
        type: 'string',
        description: 'The path to the file to write (absolute or relative to current working directory)',
        required: true
      },
      {
        name: 'content',
        type: 'string',
        description: 'The content to write to the file',
        required: true
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Writing file: ${args.path}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Wrote file: ${args.path} (${result.size} bytes)`;
    }
    return `Failed to write file: ${args.path}`;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const filePath = resolve(parameters.path);
      const dir = dirname(filePath);
      
      // Create parent directories if they don't exist
      await mkdir(dir, { recursive: true });
      
      await writeFile(filePath, parameters.content, 'utf-8');
      
      return {
        path: filePath,
        size: parameters.content.length,
        success: true
      };
    } catch (error: any) {
      return {
        path: parameters.path,
        error: error.message,
        success: false
      };
    }
  }
}
