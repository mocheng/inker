"""Base plugin class for tool plugins."""

from abc import ABC, abstractmethod
from typing import Any

from ...types import ToolParameter, ToolResult


class Plugin(ABC):
    """Base class for all tool plugins."""

    @abstractmethod
    def get_name(self) -> str:
        """Get the name of the plugin/tool."""
        ...

    @abstractmethod
    def get_description(self) -> str:
        """Get the description of the plugin/tool."""
        ...

    @abstractmethod
    def get_parameters(self) -> list[ToolParameter]:
        """Get the parameters for the plugin/tool."""
        ...

    @abstractmethod
    async def execute(self, parameters: dict[str, Any]) -> ToolResult:
        """Execute the plugin with the given parameters."""
        ...

    def get_running_description(self, args: dict[str, Any]) -> str:
        """Get a description of what the tool is doing."""
        return f"Running {self.get_name()}..."

    def get_completed_description(self, args: dict[str, Any], result: ToolResult) -> str:
        """Get a description of what the tool completed."""
        if result.success:
            return f"Completed {self.get_name()}"
        return f"Failed {self.get_name()}"

    def to_openai_tool(self) -> dict[str, Any]:
        """Convert the plugin to OpenAI tool format for LiteLLM."""
        properties: dict[str, Any] = {}
        required: list[str] = []

        for param in self.get_parameters():
            properties[param.name] = {
                "type": param.type,
                "description": param.description,
            }
            if param.required:
                required.append(param.name)

        return {
            "type": "function",
            "function": {
                "name": self.get_name(),
                "description": self.get_description(),
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                },
            },
        }
