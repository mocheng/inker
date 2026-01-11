# Inker

A minimalist CLI coding tool powered by Google Gemini AI, built with React and Ink.

## Features

- 🤖 **Multi-Provider AI Integration** - Support for Google Gemini and AWS Bedrock via Vercel AI SDK
- 🛠️ **Tool Support** - AI can execute bash commands, read/write/edit files, git operations, search code, and interact with GitHub PRs
- 💬 **Slash Commands** - Extensible command system (/help, /quit, /context)
- ⌨️ **Interactive Input** - Text input with visible cursor and command autocomplete
- 🎨 **Color-Coded Messages** - User (green), AI (white), errors (red)
- ⏱️ **Animated Progress** - Loading spinner with elapsed time counter
- 📜 **Streaming Responses** - Real-time AI response streaming
- 📊 **Observability** - Full OpenTelemetry tracing support (Jaeger, SigNoz, etc.)
- ⚡ **Performance Optimized** - Static rendering prevents unnecessary re-renders
- 🧪 **Tested** - Unit tests with Vitest and ink-testing-library

## Prerequisites

- Node.js 18+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey)) OR
- AWS Bedrock access with IAM credentials

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/inker.git
cd inker

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
LLM_PROVIDER=google
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

For AWS Bedrock:

```env
LLM_PROVIDER=bedrock
AWS_REGION=us-east-1
BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
```

See `.env.example` for reference and `docs/design/2026-01-11-multi-provider-setup.md` for detailed setup instructions.

## Usage

```bash
# Build the project
npm run build

# Run the CLI
npm start
```

### Controls

- **Type** to enter your message
- **Backspace/Delete** to edit
- **Enter** to send message
- **Ctrl+C** to exit

### Slash Commands

- `/help` - Show all available commands
- `/quit` or `/exit` - Exit the application
- `/context` - Show files in context

Type `/` to see autocomplete suggestions for all commands.

## Observability

The app exports OpenTelemetry traces and can be used with any OTLP-compatible backend.

### Option 1: Jaeger

```bash
# 1. Start Jaeger
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/jaeger:2.13.0

# 2. Run inker (uses Jaeger by default)
npm start

# 3. View traces in Jaeger UI
```

### Option 2: SigNoz (Recommended)

SigNoz is a full-stack observability platform with native OpenTelemetry support.

```bash
# 1. Start SigNoz
git clone -b main https://github.com/SigNoz/signoz.git
cd signoz/deploy
./install.sh

# 2. Run inker with SigNoz endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm start

# 3. View traces in SigNoz UI
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base OTLP endpoint | `http://localhost:4318` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Traces endpoint (overrides base) | `{base}/v1/traces` |

## Development

```bash
# Build in watch mode
npm run build -- --watch

# Run tests
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # UI mode
```

## Project Structure

```
inker/
├── src/
│   ├── cli/              # UI components
│   │   ├── commands/     # Slash command system
│   │   │   ├── types.ts
│   │   │   ├── CommandRegistry.ts
│   │   │   ├── quit.ts
│   │   │   ├── context.ts
│   │   │   ├── help.ts
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── Progress.tsx
│   │   ├── LoadingIcon.tsx
│   │   ├── HistoryItem.tsx
│   │   ├── main.tsx
│   │   └── __tests__/
│   ├── model/            # API integration
│   │   ├── tools/        # LLM tools (bash, file ops, git, etc.)
│   │   ├── llm.ts        # LLM API with tracing (multi-provider)
│   │   ├── tracing.ts    # OpenTelemetry tracing utilities
│   │   └── context.ts
│   ├── config/           # Configuration
│   └── telemetry.ts      # OpenTelemetry SDK setup
├── docs/
│   └── design/           # Design decisions (YYYY-MM-DD-brief-name.md)
├── dist/                 # Compiled output
├── .env                  # Environment config (gitignored)
├── .env.example          # Config template
├── vitest.config.ts      # Test configuration
└── package.json
```

## Documentation

- **`docs/design/`** - Important design decisions and architecture changes
  - Files are named with date prefix: `YYYY-MM-DD-brief-description.md`
  - Examples: `2026-01-11-multi-provider-setup.md`, `2026-01-04-refactoring-summary.md`
- **`docs/RELEASE.md`** - Release process and versioning guidelines
- **`CHANGELOG.md`** - Version history and notable changes

## Tech Stack

- [React](https://react.dev/) - UI framework
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [ink-text-input](https://github.com/vadimdemedes/ink-text-input) - Text input component
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vercel AI SDK](https://sdk.vercel.ai/) - Unified AI provider interface
- [OpenTelemetry](https://opentelemetry.io/) - Distributed tracing
- [Jaeger](https://www.jaegertracing.io/) - Trace visualization
- [SigNoz](https://signoz.io/) - Full-stack observability platform
- [Vitest](https://vitest.dev/) - Testing framework
- [dotenv](https://github.com/motdotla/dotenv) - Environment configuration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
