import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

export default function App() {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(c => c + 1);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return <Text color="green">Counter: {counter}</Text>;
}
