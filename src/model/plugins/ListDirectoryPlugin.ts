import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { readdir, stat } from 'fs/promises';
import { resolve, join } from 'path';

export class ListDirectoryPlugin extends Plugin {
  getName(): string {
    return 'list_directory';
  }

  getDescription(): string {
    return 'List files and directories in a given path';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'path',
        type: 'string',
        description: 'The path to the directory to list (absolute or relative to current working directory)',
        required: true
      },
      {
        name: 'recursive',
        type: 'boolean',
        description: 'Whether to list recursively (default: false)',
        required: false
      },
      {
        name: 'maxDepth',
        type: 'number',
        description: 'Maximum depth for recursive listing (default: 3)',
        required: false
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    return `Listing directory: ${args.path}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    if (result.success) {
      return `Listed directory: ${args.path} (${result.entries.length} entries)`;
    }
    return `Failed to list directory: ${args.path}`;
  }

  private async listRecursive(
    dirPath: string,
    currentDepth: number,
    maxDepth: number
  ): Promise<any[]> {
    const entries: any[] = [];
    
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        // Skip hidden files and common ignored directories
        if (item.startsWith('.') || item === 'node_modules') {
          continue;
        }
        
        const fullPath = join(dirPath, item);
        try {
          const stats = await stat(fullPath);
          const entry: any = {
            name: item,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file'
          };
          
          if (stats.isFile()) {
            entry.size = stats.size;
          }
          
          if (stats.isDirectory() && currentDepth < maxDepth) {
            entry.children = await this.listRecursive(fullPath, currentDepth + 1, maxDepth);
          }
          
          entries.push(entry);
        } catch {
          // Skip files we can't stat
        }
      }
    } catch {
      // Return empty on error
    }
    
    return entries;
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      const dirPath = resolve(parameters.path);
      const recursive = parameters.recursive ?? false;
      const maxDepth = parameters.maxDepth ?? 3;
      
      if (recursive) {
        const entries = await this.listRecursive(dirPath, 0, maxDepth);
        return {
          path: dirPath,
          entries,
          success: true
        };
      }
      
      const items = await readdir(dirPath);
      const entries: any[] = [];
      
      for (const item of items) {
        if (item.startsWith('.')) {
          continue;
        }
        
        const fullPath = join(dirPath, item);
        try {
          const stats = await stat(fullPath);
          entries.push({
            name: item,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.isFile() ? stats.size : undefined
          });
        } catch {
          entries.push({
            name: item,
            path: fullPath,
            type: 'unknown'
          });
        }
      }
      
      return {
        path: dirPath,
        entries,
        success: true
      };
    } catch (error: any) {
      return {
        path: parameters.path,
        entries: [],
        error: error.message,
        success: false
      };
    }
  }
}
