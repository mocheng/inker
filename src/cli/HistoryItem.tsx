import React from 'react';
import { Text } from 'ink';
import type { MessageType } from './types.js';

type HistoryItemProps = {
  type: MessageType;
  text: string;
};

/**
 * Parses markdown-style code syntax and returns React nodes with colored code.
 * - Inline code: `code` → yellow text without backticks
 * - Code blocks: ```code``` → yellow text without backticks
 * - Plain text remains unchanged
 */
export function parseMarkdown(text: string): React.ReactNode[] | string {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Regex matches both code blocks (```...```) and inline code (`...`)
  const codeRegex = /(```[\s\S]*?```|`[^`]+`)/g;
  let match;
  
  while ((match = codeRegex.exec(text)) !== null) {
    // Add plain text before the code match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Strip wrapping backticks and render code in yellow
    const code = match[0].startsWith('```') 
      ? match[0].slice(3, -3)  // Remove ``` from both ends
      : match[0].slice(1, -1);  // Remove ` from both ends
    parts.push(<Text key={match.index} color="yellow">{code}</Text>);
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining plain text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

export default function HistoryItem({ type, text }: HistoryItemProps) {
  if (type === 'user') {
    return <Text color="green">{text}</Text>;
  } else if (type === 'error') {
    return <Text color="red">{text}</Text>;
  } else if (type === 'shell') {
    return <Text color="yellow">{text}</Text>;
  } else {
    return <Text>{parseMarkdown(text)}</Text>;
  }
}
