# Inker

A terminal-based chat interface powered by Google Gemini AI, built with React and Ink.

## Features

- 🤖 **Google Gemini AI Integration** - Chat with AI directly from your terminal
- ⌨️ **Interactive Input** - Real-time keyboard input with backspace/delete support
- 🎨 **Color-Coded Messages** - User (green), AI (white), errors (red)
- ⏱️ **Animated Progress** - Loading spinner with elapsed time counter
- ⚡ **Performance Optimized** - Static rendering prevents unnecessary re-renders
- 🛠️ **React DevTools Compatible** - Debug your CLI app with React DevTools

## Prerequisites

- Node.js 18+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

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
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
```

See `.env.example` for reference.

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

## Development

```bash
# Build in watch mode
npm run build -- --watch

# Run with React DevTools
react-devtools  # In one terminal
npm start       # In another terminal
```

## Project Structure

```
inker/
├── src/
│   ├── cli/          # UI components
│   │   ├── App.tsx
│   │   ├── Progress.tsx
│   │   ├── LoadingIcon.tsx
│   │   └── main.tsx
│   └── model/        # API integration
│       └── gemini.ts
├── dist/             # Compiled output
├── .env              # Environment config (gitignored)
├── .env.example      # Config template
└── package.json
```

## Tech Stack

- [React](https://react.dev/) 18.2.0 - UI framework
- [Ink](https://github.com/vadimdemedes/ink) 5.2.0 - React for CLIs
- [TypeScript](https://www.typescriptlang.org/) 5.7.2 - Type safety
- [multi-llm-ts](https://github.com/nbonamy/multi-llm-ts) 4.6.2 - LLM API abstraction
- [dotenv](https://github.com/motdotla/dotenv) 17.2.3 - Environment configuration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
