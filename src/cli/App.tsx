import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, Static, useStdout, measureElement, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';
import HistoryItem from './HistoryItem.js';
import { sendMessage } from '../model/gemini.js';
import { convertToLLMMessages } from '../model/context.js';
import { loadInputHistory, saveInputHistory } from './inputHistory.js';
import type { Message } from './types.js';

const MIN_TERMINAL_MARGIN = 7;
const COMMANDS = ['/quit', '/exit'];

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
  const { stdout } = useStdout();
  const { exit } = useApp();
  const terminalHeight = stdout?.rows || 24;

  // Filter commands based on input prefix
  const getFilteredCommands = useCallback((inputValue: string): string[] => {
    if (!inputValue.startsWith('/')) {
      return [];
    }
    return COMMANDS.filter(cmd => cmd.startsWith(inputValue));
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
      // Reset the flag after a short delay to allow state update
      setTimeout(() => {
        justSelectedHintRef.current = false;
      }, 0);
    }
  }, [selectedHintIndex]);

  useInput((_input, key) => {
    const filteredCommands = getFilteredCommands(input);
    const hasHints = showHints && filteredCommands.length > 0;
    
    if (hasHints) {
      // When hints are shown, arrow keys navigate hints
      if (key.upArrow) {
        handleHintNavigation('up', filteredCommands);
      } else if (key.downArrow) {
        handleHintNavigation('down', filteredCommands);
      } else if (key.return) {
        handleSelectHint(filteredCommands);
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
    setHistory(prev => 
      prev.map(item => 
        item.id === responseId 
          ? { ...item, text }
          : item
      )
    );
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
    
    setHistory(prev => {
      const streamingItem = prev.find(item => item.id === responseId);
      const hasPartialContent = streamingItem && streamingItem.text.trim().length > 0;
      
      if (hasPartialContent) {
        // Keep partial content and append error as a new message
        return [
          ...prev,
          { id: getNextMessageId(), type: 'error', text: `Error: ${errorMsg}` }
        ];
      } else {
        // No partial content, replace empty response with error
        return prev
          .filter(item => item.id !== responseId)
          .concat({ id: getNextMessageId(), type: 'error', text: `Error: ${errorMsg}` });
      }
    });
  }, [getNextMessageId]);

  const handleSubmit = useCallback(async () => {
    // If we just selected a hint, don't submit - let user press ENTER again
    if (justSelectedHintRef.current) {
      justSelectedHintRef.current = false;
      return;
    }

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    
    // Handle quit/exit commands
    if (userMessage === '/quit' || userMessage === '/exit') {
      exit();
      return;
    }

    setInputHistory(prev => [...prev, userMessage]);
    setHistoryIndex(-1);
    setInput('');
    setShowHints(false);
    setSelectedHintIndex(0);
    setHistory(prev => [...prev, { id: getNextMessageId(), type: 'user', text: userMessage }]);
    setIsLoading(true);

    // Add placeholder for streaming response
    const responseId = getNextMessageId();
    setStreamingId(responseId);
    setHistory(prev => [...prev, { id: responseId, type: 'assistant', text: '' }]);

    try {
      let fullText = '';
      const llmHistory = convertToLLMMessages(history);
      
      await sendMessage(userMessage, llmHistory, (chunk) => {
        fullText += chunk;
        handleStreamingChunk(responseId, chunk, fullText);
      });
      
      // Final update with complete text
      updateStreamingMessage(responseId, fullText);
      setStreamingId(null);
      setIsLoading(false);
    } catch (error) {
      handleError(responseId, error);
      setStreamingId(null);
      setIsLoading(false);
    }
  }, [input, isLoading, history, getNextMessageId, handleStreamingChunk, updateStreamingMessage, handleError, exit]);

  const completedHistory = history.filter(item => item.id !== streamingId);
  const streamingItem = history.find(item => item.id === streamingId);
  const filteredCommands = getFilteredCommands(input);
  const hasHints = showHints && filteredCommands.length > 0;

  return (
    <>
      <Static items={completedHistory}>
        {(item) => <HistoryItem key={item.id} type={item.type} text={item.text} />}
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
