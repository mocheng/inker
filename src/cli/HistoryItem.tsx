import React from 'react';
import { Text } from 'ink';
import type { MessageType } from './types.js';

type HistoryItemProps = {
  type: MessageType;
  text: string;
};

export default function HistoryItem({ type, text }: HistoryItemProps) {
  if (type === 'user') {
    return <Text color="green">{text}</Text>;
  } else if (type === 'error') {
    return <Text color="red">{text}</Text>;
  } else {
    return <Text>{text}</Text>;
  }
}
