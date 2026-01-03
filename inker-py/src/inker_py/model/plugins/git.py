"""Git plugin for executing git commands."""

import asyncio
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class GitPlugin(Plugin):
    """Plugin to execute git commands."""

    def get_name(self) -> str:
        return "git"

    def get_description(self) -> str:
        return "Execute git commands and return the output"

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="args",
                type="string",
                description='The git command arguments (e.g., "status", "log --oneline -5", "diff HEAD~1")',
                required=True,
            ),
            ToolParameter(
                name="cwd",
                type="string",
                description="Optional working directory to run the git command in",
                required=False,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Running: git {args.get('args', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            return f"Completed: git {args.get('args', '')}"
        return f"Failed: git {args.get('args', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        git_args = parameters.get("args", "")
        cwd = parameters.get("cwd")

        try:
            command = f"git {git_args}"
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )
            stdout, stderr = await proc.communicate()

            return ToolResult(
                success=proc.returncode == 0,
                data={
                    "stdout": stdout.decode().strip(),
                    "stderr": stderr.decode().strip(),
                    "exit_code": proc.returncode,
                },
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"stdout": "", "stderr": str(e), "exit_code": -1},
                error=str(e),
            )
