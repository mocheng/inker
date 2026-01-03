"""Core types for inker-py."""

from dataclasses import dataclass
from enum import Enum
from typing import Any


class MessageType(Enum):
    """Types of messages in the chat."""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    ERROR = "error"


@dataclass
class Message:
    """A message in the chat history."""

    id: int
    type: MessageType
    text: str


@dataclass
class LLMMessage:
    """A message for the LLM API."""

    role: str
    content: str

    def to_dict(self) -> dict[str, str]:
        """Convert to dictionary for LLM API."""
        return {"role": self.role, "content": self.content}


@dataclass
class ToolParameter:
    """A parameter for a tool/plugin."""

    name: str
    type: str
    description: str
    required: bool = True


@dataclass
class ToolResult:
    """Result from executing a tool."""

    success: bool
    data: dict[str, Any]
    error: str | None = None
