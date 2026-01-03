"""Edit file plugin for editing file contents."""

import aiofiles
from pathlib import Path
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class EditFilePlugin(Plugin):
    """Plugin to edit file contents by string replacement."""

    def get_name(self) -> str:
        return "edit_file"

    def get_description(self) -> str:
        return "Edit a file by replacing a specific string with new content. The old_string must match exactly."

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                type="string",
                description="The path to the file to edit",
                required=True,
            ),
            ToolParameter(
                name="old_string",
                type="string",
                description="The exact string to search for and replace (must be unique in the file)",
                required=True,
            ),
            ToolParameter(
                name="new_string",
                type="string",
                description="The string to replace old_string with",
                required=True,
            ),
            ToolParameter(
                name="replace_all",
                type="boolean",
                description="Whether to replace all occurrences (default: false, only replaces first occurrence)",
                required=False,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Editing file: {args.get('path', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            replacements = result.data.get("replacements", 0)
            suffix = "" if replacements == 1 else "s"
            return f"Edited file: {args.get('path', '')} ({replacements} replacement{suffix})"
        return f"Failed to edit file: {args.get('path', '')}"

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        file_path = parameters.get("path", "")
        old_string = parameters.get("old_string", "")
        new_string = parameters.get("new_string", "")
        replace_all = parameters.get("replace_all", False)

        try:
            path = Path(file_path).resolve()

            async with aiofiles.open(path, "r", encoding="utf-8") as f:
                content = await f.read()

            # Check if old_string exists in the file
            if old_string not in content:
                return ToolResult(
                    success=False,
                    data={"path": str(path)},
                    error="old_string not found in file",
                )

            # Count occurrences
            occurrences = content.count(old_string)

            # If not replace_all and there are multiple occurrences, warn
            if not replace_all and occurrences > 1:
                return ToolResult(
                    success=False,
                    data={"path": str(path)},
                    error=f"old_string found {occurrences} times. Use replace_all: true to replace all, or provide a more unique string.",
                )

            # Perform replacement
            if replace_all:
                new_content = content.replace(old_string, new_string)
                replacements = occurrences
            else:
                new_content = content.replace(old_string, new_string, 1)
                replacements = 1

            async with aiofiles.open(path, "w", encoding="utf-8") as f:
                await f.write(new_content)

            return ToolResult(
                success=True,
                data={
                    "path": str(path),
                    "replacements": replacements,
                },
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"path": file_path},
                error=str(e),
            )
