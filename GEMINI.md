# Project Overview

This project (`inker`) is a minimalist CLI coding tool that allows users to interact with Google's Gemini models directly from their terminal. It is built using **TypeScript**, **React**, and **Ink**, providing a modern, interactive TUI (Text User Interface).

## Architecture

The project follows a clean separation of concerns:

*   **CLI / UI Layer (`src/cli/`)**: Handles the presentation and user interaction.
    *   Built with **React** and **Ink**.
    *   `main.tsx`: The entry point that mounts the React application.
    *   `App.tsx`: The main component managing the chat history, user input, and application state.
    *   `Progress.tsx`: A component for displaying loading indicators during API calls.
    *   `HistoryItem.tsx`: A component for rendering individual chat messages with color coding.
    *   `LoadingIcon.tsx`: An animated spinner component.
*   **Model / Service Layer (`src/model/`)**: Manages the business logic and API interactions.
    *   `gemini.ts`: Handles the communication with the Gemini API using the `multi-llm-ts` library. It loads configuration, initializes the model, and sends messages with streaming support.
    *   `tracing.ts`: Provides OpenTelemetry tracing utilities (`withSpan`) for instrumentation.
    *   `modelAdapter.ts`: Abstraction layer for model adapters (real and mock).
    *   `plugins/BashPlugin.ts`: Tool plugin that allows the AI to execute bash commands.
*   **Telemetry (`src/telemetry.ts`)**: OpenTelemetry SDK setup that exports traces to Genkit UI.
*   **Configuration (`src/config/`)**: Application configuration management.

## Key Files

*   **`package.json`**: Defines dependencies and scripts.
*   **`.env.example`**: A template for the required environment variables.
*   **`src/cli/main.tsx`**: The executable entry point for the CLI.
*   **`src/cli/App.tsx`**: The core application logic and UI layout.
*   **`src/model/gemini.ts`**: The interface to the Gemini LLM with tracing.
*   **`src/model/tracing.ts`**: OpenTelemetry tracing utilities.
*   **`src/telemetry.ts`**: OpenTelemetry SDK configuration for Genkit.
*   **`vitest.config.ts`**: Configuration for the Vitest test runner.

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
    Open `.env` and add your `GEMINI_API_KEY`. You can also specify the `GEMINI_MODEL` (defaults to `gemini-2.0-flash`).

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
*   **API Integration**: `multi-llm-ts` is used as an abstraction layer for the Gemini API.
*   **Tracing**: OpenTelemetry with custom Genkit exporter.
*   **Testing**: Vitest with `ink-testing-library` for component testing.
