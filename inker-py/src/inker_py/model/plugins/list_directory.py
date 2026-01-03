"""List directory plugin for listing directory contents."""

import os
from pathlib import Path
from typing import Any

from .base import Plugin
from ...types import ToolParameter, ToolResult


class ListDirectoryPlugin(Plugin):
    """Plugin to list directory contents."""

    def get_name(self) -> str:
        return "list_directory"

    def get_description(self) -> str:
        return "List files and directories in a given path"

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                type="string",
                description="The path to the directory to list (absolute or relative to current working directory)",
                required=True,
            ),
            ToolParameter(
                name="recursive",
                type="boolean",
                description="Whether to list recursively (default: false)",
                required=False,
            ),
            ToolParameter(
                name="max_depth",
                type="integer",
                description="Maximum depth for recursive listing (default: 3)",
                required=False,
            ),
        ]

    def get_running_description(self, args: dict[str, Any]) -> str:
        return f"Listing directory: {args.get('path', '')}"

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        if result.success:
            entries = result.data.get("entries", [])
            return f"Listed directory: {args.get('path', '')} ({len(entries)} entries)"
        return f"Failed to list directory: {args.get('path', '')}"

    def _list_recursive(
        self, dir_path: Path, current_depth: int, max_depth: int
    ) -> list[dict[str, Any]]:
        """Recursively list directory contents."""
        entries: list[dict[str, Any]] = []

        try:
            for item in dir_path.iterdir():
                # Skip hidden files and common ignored directories
                if item.name.startswith(".") or item.name == "node_modules":
                    continue

                try:
                    entry: dict[str, Any] = {
                        "name": item.name,
                        "path": str(item),
                        "type": "directory" if item.is_dir() else "file",
                    }

                    if item.is_file():
                        entry["size"] = item.stat().st_size

                    if item.is_dir() and current_depth < max_depth:
                        entry["children"] = self._list_recursive(
                            item, current_depth + 1, max_depth
                        )

                    entries.append(entry)
                except (PermissionError, OSError):
                    # Skip files we can't access
                    pass
        except (PermissionError, OSError):
            pass

        return entries

    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        dir_path_str = parameters.get("path", "")
        recursive = parameters.get("recursive", False)
        max_depth = parameters.get("max_depth", 3)

        try:
            dir_path = Path(dir_path_str).resolve()

            if not dir_path.exists():
                return ToolResult(
                    success=False,
                    data={"path": str(dir_path), "entries": []},
                    error="Directory does not exist",
                )

            if not dir_path.is_dir():
                return ToolResult(
                    success=False,
                    data={"path": str(dir_path), "entries": []},
                    error="Path is not a directory",
                )

            if recursive:
                entries = self._list_recursive(dir_path, 0, max_depth)
            else:
                entries = []
                for item in dir_path.iterdir():
                    if item.name.startswith("."):
                        continue

                    try:
                        entry: dict[str, Any] = {
                            "name": item.name,
                            "path": str(item),
                            "type": "directory" if item.is_dir() else "file",
                        }
                        if item.is_file():
                            entry["size"] = item.stat().st_size
                        entries.append(entry)
                    except (PermissionError, OSError):
                        entries.append(
                            {
                                "name": item.name,
                                "path": str(item),
                                "type": "unknown",
                            }
                        )

            return ToolResult(
                success=True,
                data={
                    "path": str(dir_path),
                    "entries": entries,
                },
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data={"path": dir_path_str, "entries": []},
                error=str(e),
            )
