"""Glob plugin for finding files matching a pattern."""

import asyncio
from pathlib import Path
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class GlobPlugin(Plugin):
    """Plugin to find files matching a glob pattern."""

    def get_name(self) -> str:
        return "glob"

    def get_description(self) -> str:
        return "Find files matching a glob pattern"

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="pattern",
                type="string",
                description='The glob pattern to match files (e.g., "**/*.ts", "src/**/*.test.js")',
                required=True,
            ),
            ToolParameter(
                name="path",
                type="string",
                description="The directory to search in (default: current directory)",
                required=False,
            ),
            ToolParameter(
                name="max_results",
                type="integer",
                description="Maximum number of results to return (default: 100)",
                required=False,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Finding files: {args.get('pattern', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            files = result.data.get("files", [])
            return f"Found {len(files)} files matching: {args.get('pattern', '')}"
        return f"Failed to find files: {args.get('pattern', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        pattern = parameters.get("pattern", "")
        search_path = parameters.get("path", ".")
        max_results = parameters.get("max_results", 100)

        try:
            search_path = str(Path(search_path).resolve())

            # Try fd first (faster and respects .gitignore), fallback to find
            try:
                # Check if fd is available
                proc = await asyncio.create_subprocess_shell(
                    "which fd",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()

                if proc.returncode == 0:
                    command = f"fd --type f --glob '{pattern}' '{search_path}' | head -n {max_results}"
                else:
                    raise FileNotFoundError("fd not found")
            except Exception:
                # Fallback to find with some common exclusions
                find_pattern = pattern.replace("**", "*")
                command = f"find '{search_path}' -type f -name '{find_pattern}' ! -path '*/node_modules/*' ! -path '*/.git/*' 2>/dev/null | head -n {max_results}"

            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()

            files = [
                f for f in stdout.decode().strip().split("\n") if f
            ][:max_results]

            return ToolResult(
                success=True,
                data={"files": files, "count": len(files)},
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"files": [], "count": 0},
                error=str(e),
            )
