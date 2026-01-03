"""Main CLI application using Rich."""

import asyncio
import sys
import time
from typing import Optional

from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.spinner import Spinner
from rich.text import Text
from rich.markdown import Markdown
from prompt_toolkit import PromptSession
from prompt_toolkit.history import InMemoryHistory
from prompt_toolkit.styles import Style

from ..types import Message, MessageType, LLMMessage
from ..context import convert_to_llm_messages
from ..model.llm import send_message
from .history import load_input_history, save_input_history


class InkerApp:
    """Main CLI application."""

    def __init__(self) -> None:
        self.console = Console()
        self.history: list[Message] = []
        self.input_history: list[str] = load_input_history()
        self.next_message_id = 0
        self.is_loading = False

        # Setup prompt toolkit
        pt_history = InMemoryHistory()
        for item in self.input_history:
            pt_history.append_string(item)

        self.prompt_style = Style.from_dict(
            {
                "prompt": "fg:cyan bold",
            }
        )
        self.session: PromptSession[str] = PromptSession(
            history=pt_history,
            style=self.prompt_style,
        )

    def _get_next_id(self) -> int:
        """Get the next message ID."""
        msg_id = self.next_message_id
        self.next_message_id += 1
        return msg_id

    def _render_message(self, message: Message) -> None:
        """Render a message to the console."""
        if message.type == MessageType.USER:
            self.console.print(Text(message.text, style="green"))
        elif message.type == MessageType.ERROR:
            self.console.print(Text(message.text, style="red bold"))
        else:
            # Assistant message - just print as is (already has ANSI codes from tools)
            self.console.print(message.text, markup=False, highlight=False)

    async def _stream_response(self, user_message: str) -> None:
        """Stream a response from the LLM."""
        # Add user message to history
        self.history.append(
            Message(
                id=self._get_next_id(),
                type=MessageType.USER,
                text=user_message,
            )
        )
        self._render_message(self.history[-1])

        # Prepare for streaming response
        response_text = ""
        start_time = time.time()

        # Create a loading indicator
        spinner = Spinner("dots", text=" Thinking...")

        try:
            # Buffer for streaming output
            buffer = ""
            last_flush_time = time.time()

            def on_chunk(chunk: str) -> None:
                nonlocal buffer, last_flush_time, response_text
                buffer += chunk
                response_text += chunk
                current_time = time.time()

                # Flush buffer every 100ms for smooth streaming
                if current_time - last_flush_time > 0.1 or len(buffer) > 100:
                    self.console.print(buffer, end="", markup=False, highlight=False)
                    buffer = ""
                    last_flush_time = current_time

            # Show spinner while waiting for first chunk
            with Live(spinner, console=self.console, refresh_per_second=10, transient=True):
                llm_history = convert_to_llm_messages(self.history[:-1])  # Exclude the user message we just added

                # Start the async task
                task = asyncio.create_task(send_message(user_message, llm_history, on_chunk))

                # Wait for first chunk or completion
                while not task.done() and not buffer:
                    await asyncio.sleep(0.05)

            # Continue streaming
            await task

            # Flush remaining buffer
            if buffer:
                self.console.print(buffer, end="", markup=False, highlight=False)

            # Ensure we end on a new line
            if response_text and not response_text.endswith("\n"):
                self.console.print()

            # Add assistant message to history
            self.history.append(
                Message(
                    id=self._get_next_id(),
                    type=MessageType.ASSISTANT,
                    text=response_text,
                )
            )

        except Exception as e:
            error_msg = f"Error: {str(e)}"
            self.history.append(
                Message(
                    id=self._get_next_id(),
                    type=MessageType.ERROR,
                    text=error_msg,
                )
            )
            self.console.print(Text(error_msg, style="red bold"))

    async def run(self) -> None:
        """Run the main application loop."""
        # Print welcome message
        self.console.print(
            Panel(
                "[bold cyan]Inker-py[/bold cyan]\n"
                "[dim]A minimalist CLI coding tool powered by LLM[/dim]\n\n"
                "[dim]Type your message and press Enter to send.[/dim]\n"
                "[dim]Press Ctrl+C or Ctrl+D to exit.[/dim]",
                border_style="cyan",
            )
        )

        try:
            while True:
                try:
                    # Get input from user
                    user_input = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: self.session.prompt(
                            [("class:prompt", "> ")],
                        ),
                    )

                    if not user_input.strip():
                        continue

                    # Save to input history
                    self.input_history.append(user_input)

                    # Stream the response
                    await self._stream_response(user_input)

                except KeyboardInterrupt:
                    self.console.print("\n[dim]Interrupted. Press Ctrl+C again to exit.[/dim]")
                    continue

        except (KeyboardInterrupt, EOFError):
            pass
        finally:
            # Save input history
            save_input_history(self.input_history)
            self.console.print("\n[dim]Goodbye![/dim]")


def run_app() -> None:
    """Run the application."""
    app = InkerApp()
    asyncio.run(app.run())
