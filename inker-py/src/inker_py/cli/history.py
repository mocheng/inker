"""Input history management for the CLI."""

import os
from pathlib import Path

HISTORY_FILE = Path.home() / ".config" / "inker" / "input_history"
MAX_HISTORY = 1000


def load_input_history() -> list[str]:
    """Load input history from file."""
    try:
        if HISTORY_FILE.exists():
            content = HISTORY_FILE.read_text()
            return [line for line in content.split("\n") if line.strip()]
    except Exception:
        pass
    return []


def save_input_history(history: list[str]) -> None:
    """Save input history to file."""
    try:
        HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
        to_save = history[-MAX_HISTORY:]
        HISTORY_FILE.write_text("\n".join(to_save))
    except Exception:
        pass
