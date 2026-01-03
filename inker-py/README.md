# Inker-py

A minimalist CLI coding tool powered by LLM, built with Python and Rich.

This is a Python rewrite of the [inker](https://github.com/yourusername/inker) TypeScript project.

## Features

- 🤖 **LLM Integration** - Chat with AI directly from your terminal via LiteLLM
- 🛠️ **Tool Support** - AI can execute bash commands, read/write files, git operations, and more
- ⌨️ **Interactive Input** - Text input with history navigation using prompt-toolkit
- 🎨 **Rich CLI** - Beautiful terminal UI with colors and spinners using Rich
- 📜 **Streaming Responses** - Real-time AI response streaming
- 📊 **Observability** - OpenTelemetry tracing with Jaeger or Genkit UI
- 🔌 **Extensible** - Plugin-based tool system

## Prerequisites

- Python 3.10+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/inker.git
cd inker/inker-py

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .
```

## Configuration

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

See `.env.example` for reference.

## Usage

```bash
# Run the CLI
inker

# Or run directly
python -m inker_py.cli.main
```

### Controls

- **Type** to enter your message
- **Up/Down arrows** to navigate input history
- **Enter** to send message
- **Ctrl+C** to cancel current operation
- **Ctrl+D** to exit

## Available Tools

The AI has access to the following tools:

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `read_file` | Read file contents |
| `write_file` | Write content to files |
| `edit_file` | Edit files by string replacement |
| `git` | Execute git commands |
| `github_pr` | Interact with GitHub Pull Requests |
| `grep` | Search file contents using ripgrep |
| `glob` | Find files matching patterns |
| `list_directory` | List directory contents |

## Observability

The app exports OpenTelemetry traces. You can use either **Jaeger** or **Genkit UI** to visualize them.

### Option 1: Jaeger (Default)

```bash
# 1. Start Jaeger
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/jaeger:2.13.0

# 2. Run inker (uses Jaeger by default)
inker

# 3. View traces
open http://localhost:16686
```

Select "inker-py" from the Service dropdown to see traces.

### Option 2: Genkit UI

Genkit provides a specialized UI for AI/LLM observability with Input/Output/Context tabs.

```bash
# 1. Start Genkit dev server (from main inker directory)
cd ../genkit && npm run dev

# 2. Run inker with Genkit endpoint
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4033/api/otlp inker

# 3. View traces
open http://localhost:4000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base OTLP endpoint | `http://localhost:4318` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Traces endpoint (overrides base) | `{base}/v1/traces` |
| `GEMINI_API_KEY` | Google Gemini API key | (required) |
| `GEMINI_MODEL` | LLM model to use | `gemini-2.5-flash` |
| `USE_MOCK_MODEL` | Use mock model for testing | `false` |

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linter
ruff check .

# Run type checker
mypy src
```

## Project Structure

```
inker-py/
├── src/
│   └── inker_py/
│       ├── cli/              # CLI components
│       │   ├── app.py        # Main application
│       │   ├── history.py    # Input history management
│       │   └── main.py       # Entry point
│       ├── model/            # LLM integration
│       │   ├── llm.py        # LiteLLM integration
│       │   ├── tracing.py    # OpenTelemetry tracing
│       │   └── plugins/      # Tool plugins
│       │       ├── base.py
│       │       ├── bash.py
│       │       ├── read_file.py
│       │       ├── write_file.py
│       │       ├── edit_file.py
│       │       ├── git.py
│       │       ├── github_pr.py
│       │       ├── grep.py
│       │       ├── glob.py
│       │       └── list_directory.py
│       ├── config/           # Configuration
│       │   └── config.py
│       ├── types.py          # Core types
│       ├── context.py        # Context management
│       └── telemetry.py      # OpenTelemetry setup
├── tests/                    # Test files
├── pyproject.toml           # Project configuration
├── .env.example             # Environment template
└── README.md
```

## Tech Stack

- [Rich](https://github.com/Textualize/rich) - Beautiful terminal UI
- [LiteLLM](https://github.com/BerriAI/litellm) - LLM API abstraction
- [prompt-toolkit](https://github.com/prompt-toolkit/python-prompt-toolkit) - Interactive input
- [OpenTelemetry](https://opentelemetry.io/) - Distributed tracing
- [Jaeger](https://www.jaegertracing.io/) - Trace visualization
- [aiofiles](https://github.com/Tinche/aiofiles) - Async file operations
- [pytest](https://pytest.org/) - Testing framework

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
