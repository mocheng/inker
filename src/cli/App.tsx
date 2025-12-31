import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, Static, useStdout, measureElement, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';
import HistoryItem from './HistoryItem.js';
import { sendMessage } from '../model/gemini.js';
import { loadInputHistory, saveInputHistory } from './inputHistory.js';
import type { Message } from './types.js';

let nextMessageId = 0;

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [inputHistory, setInputHistory] = useState<string[]>(() => loadInputHistory());
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputKey, setInputKey] = useState(0);
  const streamingRef = useRef<any>(null);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;

  useEffect(() => {
    return () => {
      saveInputHistory(inputHistory);
    };
  }, [inputHistory]);

  useInput((input, key) => {
    if (key.upArrow && inputHistory.length > 0) {
      const newIndex = historyIndex < inputHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInput(inputHistory[inputHistory.length - 1 - newIndex]);
      setInputKey(prev => prev + 1);
    } else if (key.downArrow) {
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
  });

  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input;
      setInputHistory(prev => [...prev, userMessage]);
      setHistoryIndex(-1);
      setInput('');
      setHistory(prev => [...prev, { id: nextMessageId++, type: 'user', text: userMessage }]);
      setIsLoading(true);

      // Add placeholder for streaming response
      const responseId = nextMessageId++;
      setStreamingId(responseId);
      setHistory(prev => [...prev, { id: responseId, type: 'assistant', text: '' }]);

      try {
        let fullText = '';
        await sendMessage(userMessage, (chunk) => {
          fullText += chunk;
          
          // Measure streaming element height if ref is available
          // Only update if content fits in terminal, otherwise buffer it
          // This is to counter the flickering issue in some terminals such as iTerm2
          // Perhaps a more elegant solution can be found later
          if (streamingRef.current) {
            const dimensions = measureElement(streamingRef.current);
            const elementHeight = dimensions.height;
            
            // Only update if element fits in terminal
            if (elementHeight < terminalHeight - 7) {
              setHistory(prev => 
                prev.map(item => 
                  item.id === responseId 
                    ? { ...item, text: fullText }
                    : item
                )
              );
            }
          } else {
            // Fallback: always update if ref not available
            setHistory(prev => 
              prev.map(item => 
                item.id === responseId 
                  ? { ...item, text: fullText }
                  : item
              )
            );
          }
        });
        
        // Final update with complete text
        setHistory(prev => 
          prev.map(item => 
            item.id === responseId 
              ? { ...item, text: fullText }
              : item
          )
        );
        setStreamingId(null);
        setIsLoading(false);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setHistory(prev => 
          prev.filter(item => item.id !== responseId)
            .concat({ id: nextMessageId++, type: 'error', text: `Error: ${errorMsg}` })
        );
        setStreamingId(null);
        setIsLoading(false);
      }
    }
  };

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
