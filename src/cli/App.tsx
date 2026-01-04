import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, Static, useStdout, measureElement, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';
import HistoryItem from './HistoryItem.js';
import { sendMessage } from '../model/gemini.js';
import { convertToLLMMessages } from '../model/context.js';
import { loadInputHistory, saveInputHistory } from './inputHistory.js';
import type { Message } from './types.js';

const MIN_TERMINAL_MARGIN = 7;

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [inputHistory, setInputHistory] = useState<string[]>(() => loadInputHistory());
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputKey, setInputKey] = useState(0);
  const nextMessageIdRef = useRef<number>(0);
  const streamingRef = useRef<Box | null>(null);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;

  useEffect(() => {
    return () => {
      saveInputHistory(inputHistory);
    };
  }, [inputHistory]);

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

  useInput((_input, key) => {
    if (key.upArrow) {
      handleHistoryNavigation('up');
    } else if (key.downArrow) {
      handleHistoryNavigation('down');
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
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    setInputHistory(prev => [...prev, userMessage]);
    setHistoryIndex(-1);
    setInput('');
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
  }, [input, isLoading, history, getNextMessageId, handleStreamingChunk, updateStreamingMessage, handleError]);

  const completedHistory = history.filter(item => item.id !== streamingId);
  const streamingItem = history.find(item => item.id === streamingId);

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
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text>&gt; </Text>
        <TextInput 
          key={inputKey}
          value={input} 
          onChange={setInput} 
          onSubmit={handleSubmit}
          showCursor={true}
        />
      </Box>
    </>
  );
}
