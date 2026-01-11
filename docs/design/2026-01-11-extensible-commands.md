# Extensible Command System

Refactored slash commands from hardcoded if-else chain to an extensible command registry pattern.

## Structure

```
src/cli/commands/
├── types.ts              # Command & CommandContext interfaces
├── CommandRegistry.ts    # Registry class for managing commands
├── quit.ts               # /quit and /exit commands
├── context.ts            # /context command
├── help.ts               # /help command
└── index.ts              # Registers all commands, exports registry
```

## Features

### Command Interface
```typescript
interface Command {
  name: string;              // Primary name
  aliases?: string[];        // Alternative names
  description: string;       // For /help display
  execute: (context) => void;
}
```

### Available Commands
- `/quit` (alias: `/exit`) - Exit the application
- `/context` - Show files in context
- `/help` - Show all available commands

### Autocomplete
- Type `/` to see all commands
- Type `/q` to filter to `/quit`
- Arrow keys to navigate, Enter to select

## Adding New Commands

1. Create new file in `src/cli/commands/`:
```typescript
// clear.ts
import type { Command } from './types.js';

export const clearCommand: Command = {
  name: 'clear',
  description: 'Clear chat history',
  execute: (context) => {
    context.setHistory([]);
    context.setIsLoading(false);
  },
};
```

2. Register in `index.ts`:
```typescript
import { clearCommand } from './clear.js';
commandRegistry.register(clearCommand);
```

That's it! The command automatically appears in autocomplete and `/help`.

## Benefits

✅ **Extensible** - Add commands without modifying App.tsx  
✅ **Self-documenting** - Description field for /help  
✅ **Testable** - Each command can be unit tested  
✅ **Type-safe** - Full TypeScript support  
✅ **Aliases** - Multiple names for same command  
✅ **Auto-complete** - Works automatically for all registered commands
