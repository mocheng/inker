"""Grep plugin for searching file contents."""

import asyncio
import re
from pathlib import Path
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class GrepPlugin(Plugin):
    """Plugin to search file contents using ripgrep."""

    def get_name(self) -> str:
        return "grep"

    def get_description(self) -> str:
        return "Search for a pattern in files using ripgrep (rg). Returns matching lines with file paths and line numbers."

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="pattern",
                type="string",
                description="The regex pattern to search for",
                required=True,
            ),
            ToolParameter(
                name="path",
                type="string",
                description="The directory or file to search in (default: current directory)",
                required=False,
            ),
            ToolParameter(
                name="file_pattern",
                type="string",
                description='Glob pattern to filter files (e.g., "*.ts", "*.{js,jsx}")',
                required=False,
            ),
            ToolParameter(
                name="case_insensitive",
                type="boolean",
                description="Whether to search case-insensitively (default: false)",
                required=False,
            ),
            ToolParameter(
                name="max_results",
                type="integer",
                description="Maximum number of results to return (default: 50)",
                required=False,
            ),
            ToolParameter(
                name="context_lines",
                type="integer",
                description="Number of context lines before and after each match (default: 0)",
                required=False,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Searching for: {args.get('pattern', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            match_count = result.data.get("match_count", 0)
            return f"Found {match_count} matches for: {args.get('pattern', '')}"
        return f"Search failed for: {args.get('pattern', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        pattern = parameters.get("pattern", "")
        search_path = parameters.get("path", ".")
        file_pattern = parameters.get("file_pattern")
        case_insensitive = parameters.get("case_insensitive", False)
        max_results = parameters.get("max_results", 50)
        context_lines = parameters.get("context_lines", 0)

        try:
            search_path = str(Path(search_path).resolve())

            # Build ripgrep command
            cmd_parts = [
                "rg",
                "--line-number",
                "--no-heading",
                "--color=never",
            ]

            if case_insensitive:
                cmd_parts.append("--ignore-case")

            if file_pattern:
                cmd_parts.extend(["--glob", file_pattern])

            if context_lines > 0:
                cmd_parts.extend(["--context", str(context_lines)])

            cmd_parts.extend(["--max-count", str(max_results)])

            # Escape pattern for shell
            escaped_pattern = pattern.replace("'", "'\\''")
            cmd_parts.extend(["--", f"'{escaped_pattern}'", f"'{search_path}'"])

            command = " ".join(cmd_parts)

            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()

            # ripgrep returns exit code 1 when no matches found
            if proc.returncode == 1 and not stderr:
                return ToolResult(
                    success=True,
                    data={"matches": [], "match_count": 0},
                )

            if proc.returncode not in (0, 1):
                return ToolResult(
                    success=False,
                    data={"matches": [], "match_count": 0},
                    error=stderr.decode().strip(),
                )

            lines = stdout.decode().strip().split("\n")
            matches: list[dict[str, Any]] = []

            # Parse ripgrep output: file:line:content or file-line-content (for context)
            for line in lines[:max_results]:
                if not line:
                    continue
                match = re.match(r"^(.+?):(\d+):(.*)$", line) or re.match(
                    r"^(.+?)-(\d+)-(.*)$", line
                )
                if match:
                    matches.append(
                        {
                            "file": match.group(1),
                            "line": int(match.group(2)),
                            "content": match.group(3),
                        }
                    )

            return ToolResult(
                success=True,
                data={"matches": matches, "match_count": len(matches)},
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"matches": [], "match_count": 0},
                error=str(e),
            )
