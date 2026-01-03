"""Configuration management for inker-py."""

import os
from pathlib import Path
from functools import lru_cache

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Default system prompt if config.toml is not found
DEFAULT_SYSTEM_PROMPT = """
You are a senior software engineer with deep expertise in software development, architecture, and best practices. Your role is to:

- Provide clear, concise, and accurate technical guidance
- Write clean, maintainable, and well-documented code
- Follow industry best practices and design patterns
- Consider performance, security, and scalability in your solutions
- Explain complex concepts in an understandable way
- Suggest improvements and optimizations when appropriate
- Debug issues systematically and provide actionable solutions

When writing code:
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the language's conventions and idioms
- Consider edge cases and error handling
- Prioritize readability and maintainability

Be direct, professional, and focus on delivering practical solutions.

You have access to tools that can help you:
- Use the bash tool to execute shell commands, check files, run programs, or gather system information
- When you need to verify something, read a file, or check system state, use the bash tool
"""


def _find_config_file() -> Path | None:
    """Find config.toml in the project hierarchy."""
    # First check if there's a config.toml in the package directory
    package_dir = Path(__file__).parent.parent.parent.parent.parent
    config_path = package_dir / "config.toml"
    if config_path.exists():
        return config_path

    # Check current working directory
    cwd_config = Path.cwd() / "config.toml"
    if cwd_config.exists():
        return cwd_config

    return None


def _load_agents_file() -> str:
    """Load AGENTS.md file from current working directory."""
    agents_path = Path.cwd() / "AGENTS.md"
    if agents_path.exists():
        return agents_path.read_text().strip()
    return ""


@lru_cache(maxsize=1)
def get_system_prompt() -> str:
    """Get the system prompt for the LLM."""
    config_path = _find_config_file()

    if config_path:
        with open(config_path, "rb") as f:
            config = tomllib.load(f)
            prompt = config.get("system", {}).get("prompt", DEFAULT_SYSTEM_PROMPT)
    else:
        prompt = DEFAULT_SYSTEM_PROMPT

    # Replace {{AGENTS}} placeholder with AGENTS.md content
    agents_content = _load_agents_file()
    prompt = prompt.replace("{{AGENTS}}", agents_content)

    return prompt


def get_model_name() -> str:
    """Get the LLM model name from environment.
    
    Ensures the model name has the 'gemini/' prefix required by LiteLLM.
    """
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    if not model.startswith("gemini/"):
        model = f"gemini/{model}"
    return model


def get_api_key() -> str:
    """Get the API key from environment."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")
    return api_key


def is_mock_mode() -> bool:
    """Check if mock mode is enabled."""
    return os.getenv("USE_MOCK_MODEL", "").lower() == "true"
