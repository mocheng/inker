"""Context management for conversation history."""

from .types import Message, MessageType, LLMMessage


def convert_to_llm_messages(history: list[Message]) -> list[LLMMessage]:
    """Convert UI messages to LLM messages."""
    result: list[LLMMessage] = []

    for msg in history:
        if msg.type == MessageType.USER:
            result.append(LLMMessage(role="user", content=msg.text))
        elif msg.type == MessageType.ASSISTANT:
            result.append(LLMMessage(role="assistant", content=msg.text))

    return result
