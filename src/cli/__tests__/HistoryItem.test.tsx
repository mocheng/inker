import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import HistoryItem, { parseMarkdown } from '../HistoryItem.js';

describe('HistoryItem', () => {
  it('renders user message in green', () => {
    const { lastFrame } = render(<HistoryItem type="user" text="Hello" />);
    expect(lastFrame()).toContain('Hello');
  });

  it('renders error message in red', () => {
    const { lastFrame } = render(<HistoryItem type="error" text="Error occurred" />);
    expect(lastFrame()).toContain('Error occurred');
  });

  it('renders shell message in yellow', () => {
    const { lastFrame } = render(<HistoryItem type="shell" text="$ ls" />);
    expect(lastFrame()).toContain('$ ls');
  });

  it('renders assistant message with markdown parsing', () => {
    const { lastFrame } = render(<HistoryItem type="assistant" text="Use `npm install`" />);
    expect(lastFrame()).toContain('Use');
    expect(lastFrame()).toContain('npm install');
  });

  it('renders system message', () => {
    const { lastFrame } = render(<HistoryItem type="system" text="System message" />);
    expect(lastFrame()).toContain('System message');
  });
});

describe('parseMarkdown', () => {
  it('returns array with plain text when no markdown', () => {
    const result = parseMarkdown('Hello world');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['Hello world']);
  });

  it('strips backticks from inline code', () => {
    const result = parseMarkdown('Use `npm install` to install');
    expect(Array.isArray(result)).toBe(true);
    
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('Use ');
    expect(lastFrame()).toContain('npm install');
    expect(lastFrame()).toContain(' to install');
    expect(lastFrame()).not.toContain('`npm install`');
  });

  it('strips backticks from code blocks', () => {
    const result = parseMarkdown('Run ```npm test``` command');
    expect(Array.isArray(result)).toBe(true);
    
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('Run ');
    expect(lastFrame()).toContain('npm test');
    expect(lastFrame()).toContain(' command');
    expect(lastFrame()).not.toContain('```');
  });

  it('handles multiple inline code segments', () => {
    const result = parseMarkdown('Use `npm` or `yarn` to install');
    expect(Array.isArray(result)).toBe(true);
    
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('npm');
    expect(lastFrame()).toContain('yarn');
    expect(lastFrame()).not.toContain('`npm`');
    expect(lastFrame()).not.toContain('`yarn`');
  });

  it('handles mixed inline code and code blocks', () => {
    const result = parseMarkdown('Use `npm` to run ```npm test```');
    expect(Array.isArray(result)).toBe(true);
    
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('npm');
    expect(lastFrame()).toContain('npm test');
    expect(lastFrame()).not.toContain('`');
  });

  it('handles code blocks with newlines', () => {
    const result = parseMarkdown('Example:\n```line1\nline2```\nDone');
    expect(Array.isArray(result)).toBe(true);
    
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('line1');
    expect(lastFrame()).toContain('line2');
    expect(lastFrame()).not.toContain('```');
  });

  it('renders code in yellow color', () => {
    const result = parseMarkdown('Use `code` here') as React.ReactNode[];
    expect(Array.isArray(result)).toBe(true);
    
    // Check that the code segment is a Text component with yellow color
    const codeElement = result[1] as React.ReactElement<{ color: string; children: string }>;
    expect(codeElement.type).toBe(Text);
    expect(codeElement.props.color).toBe('yellow');
    expect(codeElement.props.children).toBe('code');
  });

  it('handles text with no code', () => {
    const result = parseMarkdown('Plain text only');
    expect(result).toEqual(['Plain text only']);
  });

  it('handles empty string', () => {
    const result = parseMarkdown('');
    expect(result).toBe('');
  });

  it('handles code at start of text', () => {
    const result = parseMarkdown('`code` at start');
    expect(Array.isArray(result)).toBe(true);
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('code');
    expect(lastFrame()).toContain('at start');
  });

  it('handles code at end of text', () => {
    const result = parseMarkdown('End with `code`');
    expect(Array.isArray(result)).toBe(true);
    const { lastFrame } = render(<Text>{result}</Text>);
    expect(lastFrame()).toContain('End with');
    expect(lastFrame()).toContain('code');
  });
});
