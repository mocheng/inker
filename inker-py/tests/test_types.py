"""Tests for types module."""

import pytest
from inker_py.types import Message, MessageType, LLMMessage, ToolParameter, ToolResult


class TestMessage:
    """Tests for Message dataclass."""

    def test_create_user_message(self):
        msg = Message(id=1, type=MessageType.USER, text="Hello")
        assert msg.id == 1
        assert msg.type == MessageType.USER
        assert msg.text == "Hello"

    def test_create_assistant_message(self):
        msg = Message(id=2, type=MessageType.ASSISTANT, text="Hi there!")
        assert msg.id == 2
        assert msg.type == MessageType.ASSISTANT
        assert msg.text == "Hi there!"


class TestLLMMessage:
    """Tests for LLMMessage dataclass."""

    def test_to_dict(self):
        msg = LLMMessage(role="user", content="Hello")
        d = msg.to_dict()
        assert d == {"role": "user", "content": "Hello"}


class TestToolParameter:
    """Tests for ToolParameter dataclass."""

    def test_create_required_parameter(self):
        param = ToolParameter(
            name="command",
            type="string",
            description="The command to run",
            required=True
        )
        assert param.name == "command"
        assert param.required is True

    def test_create_optional_parameter(self):
        param = ToolParameter(
            name="timeout",
            type="integer",
            description="Timeout in seconds",
            required=False
        )
        assert param.name == "timeout"
        assert param.required is False


class TestToolResult:
    """Tests for ToolResult dataclass."""

    def test_create_success_result(self):
        result = ToolResult(
            success=True,
            data={"output": "hello"}
        )
        assert result.success is True
        assert result.data["output"] == "hello"
        assert result.error is None

    def test_create_error_result(self):
        result = ToolResult(
            success=False,
            data={},
            error="Something went wrong"
        )
        assert result.success is False
        assert result.error == "Something went wrong"
