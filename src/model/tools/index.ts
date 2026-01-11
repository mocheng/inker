import { Tool } from 'ai';
import { bashTool } from './bash.js';
import { readFileTool } from './readFile.js';
import { writeFileTool } from './writeFile.js';
import { editFileTool } from './editFile.js';
import { listDirectoryTool } from './listDirectory.js';
import { gitTool } from './git.js';
import { grepTool } from './grep.js';
import { globTool } from './glob.js';
import { githubPRTool } from './githubPR.js';

export const tools: Record<string, Tool> = {
  bash: bashTool,
  read_file: readFileTool,
  write_file: writeFileTool,
  edit_file: editFileTool,
  list_directory: listDirectoryTool,
  git: gitTool,
  grep: grepTool,
  glob: globTool,
  github_pr: githubPRTool,
};
