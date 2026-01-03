"""Read file plugin for reading file contents."""

import aiofiles
from pathlib import Path
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class ReadFilePlugin(Plugin):
    """Plugin to read file contents."""

    def get_name(self) -> str:
        return "read_file"

    def get_description(self) -> str:
        return "Read the contents of a file from the filesystem"

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                type="string",
                description="The path to the file to read (absolute or relative to current working directory)",
                required=True,
            )
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Reading file: {args.get('path', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            return f"Read file: {args.get('path', '')} ({result.data.get('size', 0)} bytes)"
        return f"Failed to read file: {args.get('path', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        file_path = parameters.get("path", "")

        try:
            path = Path(file_path).resolve()
            async with aiofiles.open(path, "r", encoding="utf-8") as f:
                content = await f.read()

            return ToolResult(
                success=True,
                data={
                    "content": content,
                    "path": str(path),
                    "size": len(content),
                },
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"content": "", "path": file_path, "size": 0},
                error=str(e),
            )
