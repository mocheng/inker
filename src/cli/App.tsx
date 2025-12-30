import React, { useState } from 'react';
import { Box, Text, Static, useInput } from 'ink';
import Progress from './Progress.js';
import { sendMessage } from '../model/gemini.js';

type HistoryItem = {
  id: number;
  type: 'user' | 'assistant' | 'error';
  text: string;
};

let nextMessageId = 0;

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input;
      setInput('');
      setHistory(prev => [...prev, { id: nextMessageId++, type: 'user', text: userMessage }]);
      setIsLoading(true);

      try {
        const response = await sendMessage(userMessage);

        setHistory(prev => [...prev, { id: nextMessageId++, type: 'assistant', text: response }]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setHistory(prev => [...prev, { id: nextMessageId++, type: 'error', text: `Error: ${errorMsg}` }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useInput((character, key) => {
    if (key.return) {
      handleSubmit();
    } else if (key.backspace || key.delete) {
      setInput(current => current.slice(0, -1));
    } else {
      setInput(current => current + character);
    }
  });

  return (
    <Box flexDirection="column">
      <Static items={history}>
        {(item) => {
          if (item.type === 'user') {
            return <Text key={item.id} color="green">{item.text}</Text>;
          } else if (item.type === 'error') {
            return <Text key={item.id} color="red">{item.text}</Text>;
          } else {
            return <Text key={item.id}>{item.text}</Text>;
          }
        }}
      </Static>
      {isLoading && <Progress key="progress" />}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text>&gt; {input}</Text>
      </Box>
    </Box>
  );
}
