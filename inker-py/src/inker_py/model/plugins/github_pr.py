"""GitHub PR plugin for interacting with GitHub Pull Requests."""

import asyncio
import json
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class GithubPRPlugin(Plugin):
    """Plugin to interact with GitHub Pull Requests using gh CLI."""

    def get_name(self) -> str:
        return "github_pr"

    def get_description(self) -> str:
        return "Interact with GitHub Pull Requests using the gh CLI. Supports viewing PR details, diffs, changed files, comments, and CI status."

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="action",
                type="string",
                description='The action to perform: "view" (PR metadata), "diff" (full diff), "files" (changed files), "comments" (review comments), "checks" (CI status)',
                required=True,
            ),
            ToolParameter(
                name="pr_number",
                type="integer",
                description="The PR number. If omitted, uses the current branch's PR.",
                required=False,
            ),
            ToolParameter(
                name="repo",
                type="string",
                description="Repository in owner/repo format. Defaults to current repository.",
                required=False,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        pr = f"PR #{args.get('pr_number')}" if args.get("pr_number") else "current PR"
        return f"Fetching {args.get('action', '')} for {pr}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        pr = f"PR #{args.get('pr_number')}" if args.get("pr_number") else "current PR"
        if result.success:
            return f"Fetched {args.get('action', '')} for {pr}"
        return f"Failed to fetch {args.get('action', '')} for {pr}"

    async def _check_gh_cli(self) -> bool:
        """Check if gh CLI is installed."""
        try:
            proc = await asyncio.create_subprocess_shell(
                "gh --version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()
            return proc.returncode == 0
        except Exception:
            return False

    def _build_pr_ref(self, pr_number: int | None, repo: str | None) -> str:
        """Build the PR reference for gh commands."""
        ref = ""
        if pr_number:
            ref = str(pr_number)
        if repo:
            ref += f" --repo {repo}"
        return ref

    async def _run_gh_command(self, command: str) -> tuple[str, str, int]:
        """Run a gh command and return stdout, stderr, and return code."""
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        return stdout.decode(), stderr.decode(), proc.returncode or 0

    async def _execute_view(
        self, pr_number: int | None, repo: str | None
    ) -> ToolResult:
        pr_ref = self._build_pr_ref(pr_number, repo)
        fields = "number,title,body,author,state,url,additions,deletions,baseRefName,headRefName,createdAt,updatedAt"
        command = f"gh pr view {pr_ref} --json {fields}"

        stdout, stderr, returncode = await self._run_gh_command(command)
        if returncode != 0:
            return ToolResult(success=False, data={}, error=stderr.strip())

        pr = json.loads(stdout)
        return ToolResult(
            success=True,
            data={
                "pr": {
                    "number": pr.get("number"),
                    "title": pr.get("title"),
                    "body": pr.get("body"),
                    "author": pr.get("author", {}).get("login") or pr.get("author"),
                    "state": pr.get("state"),
                    "url": pr.get("url"),
                    "additions": pr.get("additions"),
                    "deletions": pr.get("deletions"),
                    "base": pr.get("baseRefName"),
                    "head": pr.get("headRefName"),
                    "createdAt": pr.get("createdAt"),
                    "updatedAt": pr.get("updatedAt"),
                }
            },
        )

    async def _execute_diff(
        self, pr_number: int | None, repo: str | None
    ) -> ToolResult:
        pr_ref = self._build_pr_ref(pr_number, repo)
        command = f"gh pr diff {pr_ref}"

        stdout, stderr, returncode = await self._run_gh_command(command)
        if returncode != 0:
            return ToolResult(success=False, data={}, error=stderr.strip())

        return ToolResult(success=True, data={"diff": stdout})

    async def _execute_files(
        self, pr_number: int | None, repo: str | None
    ) -> ToolResult:
        pr_ref = self._build_pr_ref(pr_number, repo)
        command = f"gh pr view {pr_ref} --json files"

        stdout, stderr, returncode = await self._run_gh_command(command)
        if returncode != 0:
            return ToolResult(success=False, data={}, error=stderr.strip())

        data = json.loads(stdout)
        files = [
            {
                "path": f.get("path"),
                "additions": f.get("additions"),
                "deletions": f.get("deletions"),
            }
            for f in data.get("files", [])
        ]

        return ToolResult(
            success=True,
            data={
                "files": files,
                "count": len(files),
                "totalAdditions": sum(f.get("additions", 0) for f in files),
                "totalDeletions": sum(f.get("deletions", 0) for f in files),
            },
        )

    async def _execute_comments(
        self, pr_number: int | None, repo: str | None
    ) -> ToolResult:
        pr_ref = self._build_pr_ref(pr_number, repo)
        command = f"gh pr view {pr_ref} --json comments,reviews"

        stdout, stderr, returncode = await self._run_gh_command(command)
        if returncode != 0:
            return ToolResult(success=False, data={}, error=stderr.strip())

        data = json.loads(stdout)

        comments = [
            {
                "author": c.get("author", {}).get("login") or c.get("author"),
                "body": c.get("body"),
                "createdAt": c.get("createdAt"),
            }
            for c in data.get("comments", [])
        ]

        reviews = [
            {
                "author": r.get("author", {}).get("login") or r.get("author"),
                "state": r.get("state"),
                "body": r.get("body"),
                "createdAt": r.get("submittedAt"),
            }
            for r in data.get("reviews", [])
        ]

        return ToolResult(
            success=True,
            data={
                "comments": comments,
                "reviews": reviews,
                "commentCount": len(comments),
                "reviewCount": len(reviews),
            },
        )

    async def _execute_checks(
        self, pr_number: int | None, repo: str | None
    ) -> ToolResult:
        pr_ref = self._build_pr_ref(pr_number, repo)
        command = f"gh pr checks {pr_ref} --json name,state,conclusion,description"

        stdout, stderr, returncode = await self._run_gh_command(command)

        # gh pr checks returns exit code 1 if any check failed, but we still get data
        if returncode != 0 and not stdout:
            return ToolResult(success=False, data={}, error=stderr.strip())

        checks = json.loads(stdout)
        summary = {
            "total": len(checks),
            "passed": sum(1 for c in checks if c.get("conclusion") == "success"),
            "failed": sum(1 for c in checks if c.get("conclusion") == "failure"),
            "pending": sum(
                1 for c in checks if c.get("state") in ("pending", "queued")
            ),
        }

        return ToolResult(
            success=True,
            data={
                "checks": [
                    {
                        "name": c.get("name"),
                        "state": c.get("state"),
                        "conclusion": c.get("conclusion"),
                        "description": c.get("description"),
                    }
                    for c in checks
                ],
                "summary": summary,
            },
        )

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        # Check if gh CLI is installed
        if not await self._check_gh_cli():
            return ToolResult(
                success=False,
                data={},
                error="GitHub CLI (gh) is not installed. Install it from https://cli.github.com/",
            )

        action = parameters.get("action", "")
        pr_number = parameters.get("pr_number")
        repo = parameters.get("repo")

        try:
            if action == "view":
                return await self._execute_view(pr_number, repo)
            elif action == "diff":
                return await self._execute_diff(pr_number, repo)
            elif action == "files":
                return await self._execute_files(pr_number, repo)
            elif action == "comments":
                return await self._execute_comments(pr_number, repo)
            elif action == "checks":
                return await self._execute_checks(pr_number, repo)
            else:
                return ToolResult(
                    success=False,
                    data={},
                    error=f"Unknown action: {action}. Valid actions are: view, diff, files, comments, checks",
                )
        except Exception as e:
            return ToolResult(success=False, data={}, error=str(e))
