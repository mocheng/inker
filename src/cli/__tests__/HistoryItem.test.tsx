import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import HistoryItem from '../HistoryItem.js';

describe('HistoryItem', () => {
  it('renders user message in green', () => {
    const { lastFrame } = render(<HistoryItem type="user" text="Hello" />);
    expect(lastFrame()).toContain('Hello');
  });

  it('renders assistant message in white', () => {
    const { lastFrame } = render(<HistoryItem type="assistant" text="Hi there" />);
    expect(lastFrame()).toContain('Hi there');
  });

  it('renders error message in red', () => {
    const { lastFrame } = render(<HistoryItem type="error" text="Error occurred" />);
    expect(lastFrame()).toContain('Error occurred');
  });
});
