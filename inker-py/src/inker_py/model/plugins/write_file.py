"""Write file plugin for writing file contents."""

import aiofiles
from pathlib import Path
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class WriteFilePlugin(Plugin):
    """Plugin to write file contents."""

    def get_name(self) -> str:
        return "write_file"

    def get_description(self) -> str:
        return "Write content to a file, creating the file and parent directories if they do not exist"

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                type="string",
                description="The path to the file to write (absolute or relative to current working directory)",
                required=True,
            ),
            ToolParameter(
                name="content",
                type="string",
                description="The content to write to the file",
                required=True,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Writing file: {args.get('path', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            return f"Wrote file: {args.get('path', '')} ({result.data.get('size', 0)} bytes)"
        return f"Failed to write file: {args.get('path', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        file_path = parameters.get("path", "")
        content = parameters.get("content", "")

        try:
            path = Path(file_path).resolve()

            # Create parent directories if they don't exist
            path.parent.mkdir(parents=True, exist_ok=True)

            async with aiofiles.open(path, "w", encoding="utf-8") as f:
                await f.write(content)

            return ToolResult(
                success=True,
                data={
                    "path": str(path),
                    "size": len(content),
                },
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"path": file_path, "size": 0},
                error=str(e),
            )
