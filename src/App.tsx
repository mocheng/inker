import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

export default function App() {
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const historyElements = useMemo(
    () => history.flatMap((text, i) => [
      <Text key={`${i}-input`} color="green">{text}</Text>,
      <Text key={`${i}-response`}>what's next?</Text>
    ]),
    [history]
  );

  const handleSubmit = () => {
    if (input.trim()) {
      setHistory([...history, input]);
      setInput('');
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
      <Box>
        <Text>&gt; </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
