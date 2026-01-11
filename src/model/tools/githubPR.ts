import { Tool } from 'ai';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const githubPRTool: Tool = {
  description: 'Interact with GitHub Pull Requests using the gh CLI. Supports viewing PR details, diffs, changed files, comments, and CI status.',
  inputSchema: z.object({
    action: z.enum(['view', 'diff', 'files', 'comments', 'checks']).describe('The action to perform'),
    pr_number: z.number().optional().describe('The PR number. If omitted, uses the current branch\'s PR.'),
    repo: z.string().optional().describe('Repository in owner/repo format. Defaults to current repository.'),
  }),
  execute: async ({ action, pr_number, repo }) => {
    try {
      // Check if gh CLI is available
      await execAsync('gh --version');
      
      const prArg = pr_number ? `${pr_number}` : '';
      const repoArg = repo ? `-R ${repo}` : '';
      let command = '';
      
      switch (action) {
        case 'view':
          command = `gh pr view ${prArg} ${repoArg}`;
          break;
        case 'diff':
          command = `gh pr diff ${prArg} ${repoArg}`;
          break;
        case 'files':
          command = `gh pr view ${prArg} ${repoArg} --json files -q '.files[].path'`;
          break;
        case 'comments':
          command = `gh pr view ${prArg} ${repoArg} --comments`;
          break;
        case 'checks':
          command = `gh pr checks ${prArg} ${repoArg}`;
          break;
      }
      
      const { stdout, stderr } = await execAsync(command);
      return { output: stdout.trim(), stderr: stderr.trim(), success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  },
};
