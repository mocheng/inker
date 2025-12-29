import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Progress from './Progress.js';

export default function App() {
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [pendingInput, setPendingInput] = useState<string | null>(null);

  const historyElements = useMemo(
    () => history.flatMap((text, i) => [
      <Text key={`${i}-input`} color="green">{text}</Text>,
      <Text key={`${i}-response`}>what's next?</Text>
    ]),
    [history]
  );

  const handleSubmit = () => {
    if (input.trim()) {
      setPendingInput(input);
      setInput('');
      setTimeout(() => {
        setPendingInput(prev => {
          if (prev) setHistory(h => [...h, prev]);
          return null;
        });
      }, 3000);
    }
  };

  useInput((input, key) => {
    if (key.return) {
      handleSubmit();
    }
  });

  return (
    <Box flexDirection="column">
      {historyElements}
      {pendingInput && (
        <Box flexDirection="column">
          <Text color="green">{pendingInput}</Text>
          <Progress key={pendingInput} />
        </Box>
      )}
      <Box>
        <Text>&gt; </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
