"""Bash plugin for executing shell commands."""

import asyncio
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class BashPlugin(Plugin):
    """Plugin to execute bash commands."""

    def get_name(self) -> str:
        return "bash"

    def get_description(self) -> str:
        return "Execute bash commands and return the output"

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="command",
                type="string",
                description="The bash command to execute",
                required=True,
            )
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Executing: {args.get('command', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        return f"Executed: {args.get('command', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        command = parameters.get("command", "")

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
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
