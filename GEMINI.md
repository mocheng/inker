# Project Overview

This project (`inker`) is a Command Line Interface (CLI) chat application that allows users to interact with Google's Gemini models directly from their terminal. It is built using **TypeScript**, **React**, and **Ink**, providing a modern, interactive TUI (Text User Interface).

## Architecture

The project follows a clean separation of concerns:

*   **CLI / UI Layer (`src/cli/`)**: Handles the presentation and user interaction.
    *   Built with **React** and **Ink**.
    *   `main.tsx`: The entry point that mounts the React application.
    *   `App.tsx`: The main component managing the chat history, user input, and application state.
    *   `Progress.tsx`: A component for displaying loading indicators during API calls.
*   **Model / Service Layer (`src/model/`)**: Manages the business logic and API interactions.
    *   `gemini.ts`: Handles the communication with the Gemini API using the `multi-llm-ts` library. It loads configuration, initializes the model, and sends messages.

## Key Files

*   **`package.json`**: Defines dependencies (`ink`, `react`, `multi-llm-ts`) and scripts.
*   **`.env.example`**: A template for the required environment variables.
*   **`src/cli/main.tsx`**: The executable entry point for the CLI.
*   **`src/cli/App.tsx`**: The core application logic and UI layout.
*   **`src/model/gemini.ts`**: The interface to the Gemini LLM.

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
    Open `.env` and add your `GEMINI_API_KEY`. You can also specify the `GEMINI_MODEL` (defaults to `gemini-pro`).

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

## Development Conventions

*   **Language**: TypeScript (strict mode enabled).
*   **Framework**: React (Functional Components with Hooks).
*   **UI Library**: Ink (for rendering React components to the terminal).
*   **State Management**: Local component state (`useState`) is used for managing chat history and input.
*   **API Integration**: `multi-llm-ts` is used as an abstraction layer for the Gemini API.
