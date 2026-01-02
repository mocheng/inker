import { Plugin, PluginParameter, PluginExecutionContext } from 'multi-llm-ts';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type PRAction = 'view' | 'diff' | 'files' | 'comments' | 'checks';

export class GithubPRPlugin extends Plugin {
  getName(): string {
    return 'github_pr';
  }

  getDescription(): string {
    return 'Interact with GitHub Pull Requests using the gh CLI. Supports viewing PR details, diffs, changed files, comments, and CI status.';
  }

  getParameters(): PluginParameter[] {
    return [
      {
        name: 'action',
        type: 'string',
        description: 'The action to perform: "view" (PR metadata), "diff" (full diff), "files" (changed files), "comments" (review comments), "checks" (CI status)',
        required: true
      },
      {
        name: 'pr_number',
        type: 'number',
        description: 'The PR number. If omitted, uses the current branch\'s PR.',
        required: false
      },
      {
        name: 'repo',
        type: 'string',
        description: 'Repository in owner/repo format. Defaults to current repository.',
        required: false
      }
    ];
  }

  getRunningDescription(_tool: string, args: any): string {
    const pr = args.pr_number ? `PR #${args.pr_number}` : 'current PR';
    return `Fetching ${args.action} for ${pr}`;
  }

  getCompletedDescription(_tool: string, args: any, result: any): string {
    const pr = args.pr_number ? `PR #${args.pr_number}` : 'current PR';
    if (result.success) {
      return `Fetched ${args.action} for ${pr}`;
    }
    return `Failed to fetch ${args.action} for ${pr}`;
  }

  private async checkGhCli(): Promise<boolean> {
    try {
      await execAsync('gh --version');
      return true;
    } catch {
      return false;
    }
  }

  private buildPrRef(prNumber?: number, repo?: string): string {
    let ref = '';
    if (prNumber) {
      ref = String(prNumber);
    }
    if (repo) {
      ref += ` --repo ${repo}`;
    }
    return ref;
  }

  private async executeView(prNumber?: number, repo?: string): Promise<any> {
    const prRef = this.buildPrRef(prNumber, repo);
    const fields = 'number,title,body,author,state,url,additions,deletions,baseRefName,headRefName,createdAt,updatedAt';
    const command = `gh pr view ${prRef} --json ${fields}`;
    
    const { stdout } = await execAsync(command);
    const pr = JSON.parse(stdout);
    
    return {
      success: true,
      pr: {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        author: pr.author?.login || pr.author,
        state: pr.state,
        url: pr.url,
        additions: pr.additions,
        deletions: pr.deletions,
        base: pr.baseRefName,
        head: pr.headRefName,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt
      }
    };
  }

  private async executeDiff(prNumber?: number, repo?: string): Promise<any> {
    const prRef = this.buildPrRef(prNumber, repo);
    const command = `gh pr diff ${prRef}`;
    
    const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    
    return {
      success: true,
      diff: stdout
    };
  }

  private async executeFiles(prNumber?: number, repo?: string): Promise<any> {
    const prRef = this.buildPrRef(prNumber, repo);
    const command = `gh pr view ${prRef} --json files`;
    
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    const files = data.files.map((f: any) => ({
      path: f.path,
      additions: f.additions,
      deletions: f.deletions
    }));
    
    return {
      success: true,
      files,
      count: files.length,
      totalAdditions: files.reduce((sum: number, f: any) => sum + f.additions, 0),
      totalDeletions: files.reduce((sum: number, f: any) => sum + f.deletions, 0)
    };
  }

  private async executeComments(prNumber?: number, repo?: string): Promise<any> {
    const prRef = this.buildPrRef(prNumber, repo);
    const command = `gh pr view ${prRef} --json comments,reviews`;
    
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    const comments = (data.comments || []).map((c: any) => ({
      author: c.author?.login || c.author,
      body: c.body,
      createdAt: c.createdAt
    }));
    
    const reviews = (data.reviews || []).map((r: any) => ({
      author: r.author?.login || r.author,
      state: r.state,
      body: r.body,
      createdAt: r.submittedAt
    }));
    
    return {
      success: true,
      comments,
      reviews,
      commentCount: comments.length,
      reviewCount: reviews.length
    };
  }

  private async executeChecks(prNumber?: number, repo?: string): Promise<any> {
    const prRef = this.buildPrRef(prNumber, repo);
    const command = `gh pr checks ${prRef} --json name,state,conclusion,description`;
    
    try {
      const { stdout } = await execAsync(command);
      const checks = JSON.parse(stdout);
      
      const summary = {
        total: checks.length,
        passed: checks.filter((c: any) => c.conclusion === 'success').length,
        failed: checks.filter((c: any) => c.conclusion === 'failure').length,
        pending: checks.filter((c: any) => c.state === 'pending' || c.state === 'queued').length
      };
      
      return {
        success: true,
        checks: checks.map((c: any) => ({
          name: c.name,
          state: c.state,
          conclusion: c.conclusion,
          description: c.description
        })),
        summary
      };
    } catch (error: any) {
      // gh pr checks returns exit code 1 if any check failed
      if (error.stdout) {
        const checks = JSON.parse(error.stdout);
        const summary = {
          total: checks.length,
          passed: checks.filter((c: any) => c.conclusion === 'success').length,
          failed: checks.filter((c: any) => c.conclusion === 'failure').length,
          pending: checks.filter((c: any) => c.state === 'pending' || c.state === 'queued').length
        };
        
        return {
          success: true,
          checks: checks.map((c: any) => ({
            name: c.name,
            state: c.state,
            conclusion: c.conclusion,
            description: c.description
          })),
          summary
        };
      }
      throw error;
    }
  }

  async execute(_context: PluginExecutionContext, parameters: any): Promise<any> {
    try {
      // Check if gh CLI is installed
      const hasGh = await this.checkGhCli();
      if (!hasGh) {
        return {
          success: false,
          error: 'GitHub CLI (gh) is not installed. Install it from https://cli.github.com/'
        };
      }
      
      const action = parameters.action as PRAction;
      const prNumber = parameters.pr_number;
      const repo = parameters.repo;
      
      switch (action) {
        case 'view':
          return await this.executeView(prNumber, repo);
        case 'diff':
          return await this.executeDiff(prNumber, repo);
        case 'files':
          return await this.executeFiles(prNumber, repo);
        case 'comments':
          return await this.executeComments(prNumber, repo);
        case 'checks':
          return await this.executeChecks(prNumber, repo);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Valid actions are: view, diff, files, comments, checks`
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.stderr || error.message
      };
    }
  }
}
