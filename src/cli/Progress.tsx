import React, { useState, useEffect } from 'react';
import { Text } from 'ink';
import LoadingIcon from './LoadingIcon.js';

export default function Progress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const elapsedTimer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(elapsedTimer);
  }, []);

  return <Text color="gray"><LoadingIcon /> Thinking ... {elapsed}s</Text>;
}
