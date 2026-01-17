import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, Static, useStdout, measureElement, useInput, useApp, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';
import HistoryItem from './HistoryItem.js';
import { sendMessage } from '../model/llm.js';
import { convertToLLMMessages } from '../model/context.js';
import { loadInputHistory, saveInputHistory } from './inputHistory.js';
import { getContextFiles } from '../model/contextManager.js';
import { commandRegistry } from './commands/index.js';
import { filterCommands } from './appUtils.js';
import {
  updateStreamingMessage as updateStreamingMsg,
  handleErrorMessage as handleErrorMsg,
  addUserMessage,
  addAssistantPlaceholder,
  addShellMessage,
  addErrorMessage,
  isBashCommand,
  extractBashCommand,
  getCompletedHistory,
  getStreamingItem,
} from './messageUtils.js';
import {
  INKER_ASCII_ART,
  MIN_TERMINAL_MARGIN,
  DEFAULT_TERMINAL_HEIGHT,
  HINT_SELECTION_DELAY,
  MAX_EXEC_BUFFER,
} from './constants.js';
import type { Message } from './types.js';

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [inputHistory, setInputHistory] = useState<string[]>(() => loadInputHistory());
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputKey, setInputKey] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [selectedHintIndex, setSelectedHintIndex] = useState(0);
  const justSelectedHintRef = useRef<boolean>(false);
  const nextMessageIdRef = useRef<number>(0);
  const streamingRef = useRef<React.ElementRef<typeof Box> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { stdout } = useStdout();
  const { stdin, setRawMode } = useStdin();
  const { exit } = useApp();
  const terminalHeight = stdout?.rows || DEFAULT_TERMINAL_HEIGHT;

  // Filter commands based on input prefix
  const getFilteredCommands = useCallback((inputValue: string): string[] => {
    const allCommands = commandRegistry.getAllCommandsWithAliases();
    return filterCommands(inputValue, allCommands);
  }, []);

  useEffect(() => {
    return () => {
      saveInputHistory(inputHistory);
    };
  }, [inputHistory]);

  // Reset selected hint index when filtered commands change
  useEffect(() => {
    const filteredCommands = getFilteredCommands(input);
    if (filteredCommands.length > 0 && selectedHintIndex >= filteredCommands.length) {
      setSelectedHintIndex(0);
    }
  }, [input, getFilteredCommands, selectedHintIndex]);

  const handleHistoryNavigation = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up' && inputHistory.length > 0) {
      const maxIndex = inputHistory.length - 1;
      const newIndex = historyIndex < maxIndex ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInput(inputHistory[inputHistory.length - 1 - newIndex]);
      setInputKey(prev => prev + 1);
    } else if (direction === 'down') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(inputHistory[inputHistory.length - 1 - newIndex]);
        setInputKey(prev => prev + 1);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
        setInputKey(prev => prev + 1);
      }
    }
  }, [inputHistory, historyIndex]);

  const handleHintNavigation = useCallback((direction: 'up' | 'down', filteredCommands: string[]) => {
    if (filteredCommands.length === 0) return;
    
    if (direction === 'up') {
      setSelectedHintIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (direction === 'down') {
      setSelectedHintIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    }
  }, []);

  const handleSelectHint = useCallback((filteredCommands: string[]) => {
    if (filteredCommands.length > 0 && selectedHintIndex >= 0 && selectedHintIndex < filteredCommands.length) {
      const selectedCommand = filteredCommands[selectedHintIndex];
      justSelectedHintRef.current = true;
      setInput(selectedCommand);
      setInputKey(prev => prev + 1); // Reset TextInput to position cursor at end
      setShowHints(false);
      setSelectedHintIndex(0);
      // Reset the flag after user can press Enter again
      setTimeout(() => {
        justSelectedHintRef.current = false;
      }, HINT_SELECTION_DELAY);
    }
  }, [selectedHintIndex]);

  useInput((_input, key) => {
    // Handle Ctrl+C to abort LLM operation or exit app
    if (key.ctrl && _input === 'c') {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsLoading(false);
        setStreamingId(null);
        return; // Don't exit, just abort
      }
      // If no active LLM operation, exit the app
      exit();
      return;
    }

    const filteredCommands = getFilteredCommands(input);
    const hasHints = showHints && filteredCommands.length > 0;
    
    if (hasHints && key.return) {
      // When hints are shown and Enter is pressed, select hint and prevent submit
      handleSelectHint(filteredCommands);
      return;
    }
    
    if (hasHints) {
      // When hints are shown, arrow keys navigate hints
      if (key.upArrow) {
        handleHintNavigation('up', filteredCommands);
      } else if (key.downArrow) {
        handleHintNavigation('down', filteredCommands);
      }
    } else {
      // When hints are not shown, arrow keys navigate history
      if (key.upArrow) {
        handleHistoryNavigation('up');
      } else if (key.downArrow) {
        handleHistoryNavigation('down');
      }
    }
  });

  const getNextMessageId = useCallback(() => {
    return nextMessageIdRef.current++;
  }, []);

  const updateStreamingMessage = useCallback((responseId: number, text: string) => {
    setHistory(prev => updateStreamingMsg(prev, responseId, text));
  }, []);

  const shouldUpdateStreaming = useCallback((fullText: string): boolean => {
    if (!streamingRef.current) {
      return true; // Fallback: always update if ref not available
    }

    try {
      const dimensions = measureElement(streamingRef.current);
      const elementHeight = dimensions.height;
      // Only update if element fits in terminal to prevent flickering
      // This is a workaround for terminal rendering issues in some terminals like iTerm2
      return elementHeight < terminalHeight - MIN_TERMINAL_MARGIN;
    } catch {
      // If measurement fails, allow update
      return true;
    }
  }, [terminalHeight]);

  const handleStreamingChunk = useCallback((responseId: number, chunk: string, fullText: string) => {
    if (shouldUpdateStreaming(fullText)) {
      updateStreamingMessage(responseId, fullText);
    }
  }, [shouldUpdateStreaming, updateStreamingMessage]);

  const handleError = useCallback((responseId: number, error: unknown) => {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    setHistory(prev => handleErrorMsg(prev, responseId, errorMsg, getNextMessageId));
  }, [getNextMessageId]);

  const handleSubmit = useCallback(async () => {
    // If we just selected a hint, don't submit - let user press ENTER again
    if (justSelectedHintRef.current) {
      return; // Don't reset the flag here
    }

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    
    // Try to execute as a command
    const commandContext = {
      input: userMessage,
      args: [],
      setHistory,
      setIsLoading,
      exit,
      getNextMessageId,
      getContextFiles,
    };
    
    const wasCommand = await commandRegistry.execute(userMessage, commandContext);
    if (wasCommand) {
      // Clear input for commands
      setInput('');
      setShowHints(false);
      setSelectedHintIndex(0);
      return;
    }

    setInputHistory(prev => [...prev, userMessage]);
    setHistoryIndex(-1);
    setInput('');
    setShowHints(false);
    setSelectedHintIndex(0);
    setHistory(prev => addUserMessage(prev, getNextMessageId(), userMessage));
    setIsLoading(true);

    // Handle bash command execution
    if (isBashCommand(userMessage)) {
      const command = extractBashCommand(userMessage);
      const responseId = getNextMessageId();
      
      try {
        const { execSync } = await import('child_process');
        const output = execSync(command, { encoding: 'utf-8', maxBuffer: MAX_EXEC_BUFFER });
        setHistory(prev => addShellMessage(prev, responseId, output));
      } catch (error: any) {
        const errorMsg = error.stderr || error.message || 'Command execution failed';
        setHistory(prev => addErrorMessage(prev, responseId, errorMsg));
      }
      setIsLoading(false);
      return;
    }

    // Add placeholder for streaming response
    const responseId = getNextMessageId();
    setStreamingId(responseId);
    setHistory(prev => addAssistantPlaceholder(prev, responseId));

    abortControllerRef.current = new AbortController();

    try {
      let fullText = '';
      const llmHistory = convertToLLMMessages(history);
      
      await sendMessage(userMessage, llmHistory, (chunk) => {
        fullText += chunk;
        handleStreamingChunk(responseId, chunk, fullText);
      }, abortControllerRef.current.signal);
      
      // Final update with complete text
      updateStreamingMessage(responseId, fullText);
      setStreamingId(null);
      setIsLoading(false);
    } catch (error) {
      handleError(responseId, error);
      setStreamingId(null);
      setIsLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [input, isLoading, history, getNextMessageId, handleStreamingChunk, updateStreamingMessage, handleError, exit]);

  const completedHistory = getCompletedHistory(history, streamingId);
  const streamingItem = getStreamingItem(history, streamingId);
  const filteredCommands = getFilteredCommands(input);
  const hasHints = showHints && filteredCommands.length > 0;

  const staticItems = [
    <Box key="header" marginBottom={1}>
      <Text color="cyan" bold>
        {INKER_ASCII_ART}
      </Text>
    </Box>,
    ...completedHistory.map(item => (
      <HistoryItem key={item.id} type={item.type} text={item.text} />
    ))
  ];

  return (
    <>
      <Static items={staticItems}>
        {(item) => item}
      </Static>
      {streamingItem && (
        <Box ref={streamingRef}>
          <HistoryItem type={streamingItem.type} text={streamingItem.text} />
        </Box>
      )}
      {isLoading && <Progress key="progress" />}
      {hasHints && (
        <Box paddingX={1} marginBottom={1} flexDirection="column">
          {filteredCommands.map((command, index) => (
            <Box key={command}>
              <Text>
                {index === selectedHintIndex ? (
                  <Text color="cyan" inverse>{command}</Text>
                ) : (
                  <Text dimColor>{command}</Text>
                )}
              </Text>
            </Box>
          ))}
        </Box>
      )}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text>&gt; </Text>
        <TextInput 
          key={inputKey}
          value={input} 
          onChange={(value) => {
            setInput(value);
            const shouldShow = value.startsWith('/');
            setShowHints(shouldShow);
            if (shouldShow) {
              // Reset selected index when input changes
              setSelectedHintIndex(0);
            }
          }} 
          onSubmit={handleSubmit}
          showCursor={true}
        />
      </Box>
    </>
  );
}
