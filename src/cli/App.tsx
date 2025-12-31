import React, { useState, useRef } from 'react';
import { Box, Text, Static, useStdout, measureElement } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';
import HistoryItem from './HistoryItem.js';
import { sendMessage } from '../model/gemini.js';
import type { Message } from './types.js';

let nextMessageId = 0;

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const streamingRef = useRef<any>(null);
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;

  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input;
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
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </>
  );
}
