# Project Overview

This project (`inker`) is a minimalist CLI coding tool that allows users to interact with Google's Gemini models directly from their terminal. It is built using **TypeScript**, **React**, and **Ink**, providing a modern, interactive TUI (Text User Interface).

## Architecture

The project follows a clean separation of concerns:

*   **CLI / UI Layer (`src/cli/`)**: Handles the presentation and user interaction.
    *   Built with **React** and **Ink**.
    *   `main.tsx`: The entry point that mounts the React application.
    *   `App.tsx`: The main component managing the chat history, user input, and application state.
    *   `commands/`: Extensible slash command system with CommandRegistry.
    *   `Progress.tsx`: A component for displaying loading indicators during API calls.
    *   `HistoryItem.tsx`: A component for rendering individual chat messages with color coding.
    *   `LoadingIcon.tsx`: An animated spinner component.
*   **Model / Service Layer (`src/model/`)**: Manages the business logic and API interactions.
    *   `llm.ts`: Handles communication with LLM providers (Google Gemini, AWS Bedrock) using the Vercel AI SDK. It loads configuration, initializes the model, and sends messages with streaming support.
    *   `tools/`: LLM tools (bash, file operations, git, grep, glob, GitHub PR) defined using Zod schemas.
    *   `tracing.ts`: Provides OpenTelemetry tracing utilities (`withSpan`) for instrumentation.
    *   `context.ts`: Converts UI messages to Vercel AI SDK message format.
*   **Telemetry (`src/telemetry.ts`)**: OpenTelemetry SDK setup that exports traces to Genkit UI.
*   **Configuration (`src/config/`)**: Application configuration management.

## Key Files

*   **`package.json`**: Defines dependencies and scripts.
*   **`.env.example`**: A template for the required environment variables.
*   **`src/cli/main.tsx`**: The executable entry point for the CLI.
*   **`src/cli/App.tsx`**: The core application logic and UI layout.
*   **`src/cli/commands/`**: Extensible slash command system with registry pattern.
*   **`src/model/llm.ts`**: The interface to LLM providers (Gemini, Bedrock) with tracing.
*   **`src/model/tools/`**: LLM tools for bash, file operations, git, code search, GitHub PRs.
*   **`src/model/tracing.ts`**: OpenTelemetry tracing utilities.
*   **`src/telemetry.ts`**: OpenTelemetry SDK configuration for Genkit.
*   **`vitest.config.ts`**: Configuration for the Vitest test runner.
*   **`docs/design/`**: Important design decisions and architecture changes (files named `YYYY-MM-DD-brief-description.md`).

## Building and Running

### Prerequisites

*   Node.js (LTS recommended)
*   A Google Gemini API Key

### Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env` file in the root directory based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    
    For Google Gemini:
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
    
    Note: AWS credentials are read from `~/.aws/credentials`. Configure with `aws configure`.

### Build

Compile the TypeScript code to JavaScript:

```bash
npm run build
```

This uses `tsc` to compile files from `src/` to `dist/`.

### Run

Start the CLI application:

```bash
npm start
```

This runs `node dist/cli/main.js`.

### Run with Genkit UI (Observability)

To view traces in Genkit UI:

1.  Start Genkit in the `genkit/` folder:
    ```bash
    cd genkit && npm run dev
    ```
2.  Open Genkit UI at `http://localhost:4000`
3.  Run the CLI in another terminal - traces will appear in Genkit UI

## Tracing

The application uses OpenTelemetry to instrument LLM calls:

*   **Spans**: Each `gemini.chat` and `gemini.generate.N` operation creates a span
*   **Attributes**: Spans include `input-json`, `output-json`, and `context-json` for Genkit UI display
*   **Export**: Traces are exported to Genkit's OTLP endpoint at `http://localhost:4033/api/otlp`

## Development Conventions

*   **Language**: TypeScript (strict mode enabled).
*   **Framework**: React (Functional Components with Hooks).
*   **UI Library**: Ink (for rendering React components to the terminal).
*   **Input Handling**: `ink-text-input` for text input with cursor support.
*   **State Management**: Local component state (`useState`) is used for managing chat history and input.
*   **API Integration**: Vercel AI SDK is used for unified LLM provider access (Google Gemini, AWS Bedrock).
*   **Tracing**: OpenTelemetry with custom Genkit exporter.
*   **Testing**: Vitest with `ink-testing-library` for component testing.
