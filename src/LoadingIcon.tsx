import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export default function LoadingIcon() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFrameIndex(i => (i + 1) % frames.length), 80);
    return () => clearInterval(timer);
  }, []);

  return <Text>{frames[frameIndex]}</Text>;
}
