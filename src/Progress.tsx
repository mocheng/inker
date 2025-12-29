import React, { useState, useEffect } from 'react';
import { Text } from 'ink';
import LoadingIcon from './LoadingIcon.js';

export default function Progress() {
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    const elapsedTimer = setInterval(() => setElapsed(s => s + 1), 1000);
    setElapsed(0);
    
    return () => {
      clearTimeout(timer);
      clearInterval(elapsedTimer);
    };
  }, []);

  return visible ? <Text color="gray"><LoadingIcon /> Thinking ... {elapsed}s</Text> : null;
}
