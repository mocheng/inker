import React, { useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';
import { sendMessage } from '../model/gemini.js';

type HistoryItem = {
  type: 'user' | 'assistant' | 'error';
  text: string;
};

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const historyElements = useMemo(
    () => history.map((item, i) => {
      if (item.type === 'user') {
        return <Text key={i} color="green">{item.text}</Text>;
      } else if (item.type === 'error') {
        return <Text key={i} color="red">{item.text}</Text>;
      } else {
        return <Text key={i}>{item.text}</Text>;
      }
    }),
    [history]
  );

  const handleSubmit = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = input;
      setInput('');
      setHistory(prev => [...prev, { type: 'user', text: userMessage }]);
      setIsLoading(true);

      try {
        const response = await sendMessage(userMessage);
        setHistory(prev => [...prev, { type: 'assistant', text: response }]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setHistory(prev => [...prev, { type: 'error', text: `Error: ${errorMsg}` }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box flexDirection="column">
      {historyElements}
      {isLoading && <Progress />}
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text>&gt; </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
