"""LLM integration using LiteLLM."""

import json
import os
from typing import Any, AsyncGenerator, Callable

import litellm
from litellm import acompletion

from ..config import get_system_prompt
from ..types import LLMMessage
from .tracing import with_span
from .plugins.base import Plugin
from .plugins import (
    BashPlugin,
    ReadFilePlugin,
    WriteFilePlugin,
    EditFilePlugin,
    GitPlugin,
    GithubPRPlugin,
    GrepPlugin,
    GlobPlugin,
    ListDirectoryPlugin,
)

# Suppress LiteLLM logs
litellm.suppress_debug_info = True


def get_model_name() -> str:
    """Get the model name from environment.
    
    Ensures the model name has the 'gemini/' prefix required by LiteLLM.
    """
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if not model.startswith("gemini/"):
        model = f"gemini/{model}"
    return model


def get_api_key() -> str:
    """Get the API key from environment."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")
    return api_key


def get_plugins() -> list[Plugin]:
    """Get all available plugins."""
    return [
        BashPlugin(),
        ReadFilePlugin(),
        WriteFilePlugin(),
        EditFilePlugin(),
        GitPlugin(),
        GithubPRPlugin(),
        GrepPlugin(),
        GlobPlugin(),
        ListDirectoryPlugin(),
    ]


def get_tools() -> list[dict[str, Any]]:
    """Get tools in OpenAI format for LiteLLM."""
    return [plugin.to_openai_tool() for plugin in get_plugins()]


def get_plugin_by_name(name: str) -> Plugin | None:
    """Get a plugin by name."""
    for plugin in get_plugins():
        if plugin.get_name() == name:
            return plugin
    return None


async def send_message(
    message: str,
    conversation_history: list[LLMMessage],
    on_chunk: Callable[[str], None],
) -> str:
    """Send a message to the LLM and stream the response.

    Args:
        message: The user message
        conversation_history: Previous conversation messages
        on_chunk: Callback for each chunk of the response

    Returns:
        The full response text
    """
    model = get_model_name()
    api_key = get_api_key()

    async with with_span(
        "llm.chat",
        {
            "gen_ai.system": "google",
            "gen_ai.request.model": model,
            "gen_ai.operation.name": "chat",
            "input-json": json.dumps({"message": message}),
            "context-json": json.dumps(
                {
                    "model": model,
                    "conversationLength": len(conversation_history),
                }
            ),
        },
    ) as chat_span:
        # Build messages
        messages: list[dict[str, str]] = [
            {"role": "system", "content": get_system_prompt()},
        ]
        messages.extend([m.to_dict() for m in conversation_history])
        messages.append({"role": "user", "content": message})

        full_response = ""
        iteration_count = 0
        tools = get_tools()

        while True:
            has_tool_calls = False
            tool_results: list[dict[str, Any]] = []

            async with with_span(
                f"llm.generate.{iteration_count}",
                {
                    "gen_ai.system": "google",
                    "gen_ai.request.model": model,
                    "gen_ai.operation.name": "generate",
                    "llm.iteration": iteration_count,
                    "llm.message_count": len(messages),
                    "input-json": json.dumps(messages),
                },
            ) as gen_span:
                iteration_response = ""

                try:
                    response = await acompletion(
                        model=model,
                        messages=messages,
                        tools=tools if tools else None,
                        stream=True,
                        api_key=api_key,
                    )

                    current_tool_calls: list[dict[str, Any]] = []

                    async for chunk in response:
                        delta = chunk.choices[0].delta if chunk.choices else None
                        if not delta:
                            continue

                        # Handle content
                        if delta.content:
                            full_response += delta.content
                            iteration_response += delta.content
                            on_chunk(delta.content)

                        # Handle tool calls
                        if delta.tool_calls:
                            has_tool_calls = True
                            for tool_call in delta.tool_calls:
                                idx = tool_call.index
                                while len(current_tool_calls) <= idx:
                                    current_tool_calls.append(
                                        {
                                            "id": "",
                                            "name": "",
                                            "arguments": "",
                                        }
                                    )

                                if tool_call.id:
                                    current_tool_calls[idx]["id"] = tool_call.id
                                if tool_call.function:
                                    if tool_call.function.name:
                                        current_tool_calls[idx][
                                            "name"
                                        ] = tool_call.function.name
                                    if tool_call.function.arguments:
                                        current_tool_calls[idx][
                                            "arguments"
                                        ] += tool_call.function.arguments

                    # Process tool calls
                    if current_tool_calls:
                        # Add assistant message with tool calls
                        messages.append(
                            {
                                "role": "assistant",
                                "content": iteration_response or None,
                                "tool_calls": [
                                    {
                                        "id": tc["id"],
                                        "type": "function",
                                        "function": {
                                            "name": tc["name"],
                                            "arguments": tc["arguments"],
                                        },
                                    }
                                    for tc in current_tool_calls
                                ],
                            }
                        )

                        for tc in current_tool_calls:
                            tool_name = tc["name"]
                            try:
                                args = json.loads(tc["arguments"])
                            except json.JSONDecodeError:
                                args = {}

                            plugin = get_plugin_by_name(tool_name)
                            if plugin:
                                # Show running status
                                running_msg = f"\n[Tool: {tool_name}] {plugin.get_running_description(args)}\n"
                                on_chunk(running_msg)
                                full_response += running_msg

                                # Execute the tool
                                result = await plugin.execute(args)

                                # Show completed status
                                completed_msg = f"[Tool: {tool_name}] {plugin.get_completed_description(args, result)}\n"
                                on_chunk(completed_msg)
                                full_response += completed_msg

                                # Show output if present
                                if result.success and result.data:
                                    if "stdout" in result.data and result.data["stdout"]:
                                        output = result.data["stdout"]
                                        on_chunk(f"\x1b[36m{output}\x1b[0m\n")
                                        full_response += f"{output}\n"
                                    if "stderr" in result.data and result.data["stderr"]:
                                        output = result.data["stderr"]
                                        on_chunk(f"\x1b[31m{output}\x1b[0m\n")
                                        full_response += f"{output}\n"

                                gen_span.add_event(
                                    "tool.completed", {"tool.name": tool_name}
                                )

                                tool_results.append(
                                    {
                                        "tool_call_id": tc["id"],
                                        "role": "tool",
                                        "content": json.dumps(result.data),
                                    }
                                )
                            else:
                                tool_results.append(
                                    {
                                        "tool_call_id": tc["id"],
                                        "role": "tool",
                                        "content": json.dumps(
                                            {"error": f"Unknown tool: {tool_name}"}
                                        ),
                                    }
                                )

                        # Add tool results to messages
                        messages.extend(tool_results)

                except Exception as e:
                    gen_span.record_exception(e)
                    raise

                # Set output for this generation
                gen_span.set_attribute(
                    "output-json",
                    json.dumps([{"role": "assistant", "content": iteration_response}]),
                )
                gen_span.set_attribute("llm.has_tool_calls", has_tool_calls)

            iteration_count += 1

            if not has_tool_calls:
                break

        # Set output for the chat span
        chat_span.set_attribute(
            "output-json", json.dumps({"response": full_response})
        )

        return full_response


class MockModelAdapter:
    """Mock model adapter for testing."""

    async def generate(
        self, messages: list[dict[str, str]], on_chunk: Callable[[str], None]
    ) -> str:
        """Generate a mock response."""
        last_message = messages[-1] if messages else {}
        prompt = last_message.get("content", "")

        response = f"I am a mock AI assistant. This simulates the model behavior. You said: \"{prompt[:50]}...\""
        on_chunk(response)
        return response
