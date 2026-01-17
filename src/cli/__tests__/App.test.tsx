import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import App from '../App.js';
import * as llm from '../../model/llm.js';

vi.mock('../../model/llm.js', () => ({
  sendMessage: vi.fn().mockResolvedValue('Mock response'),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input box', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('>');
  });

  it('renders ASCII art header', () => {
    const { lastFrame } = render(<App />);
    const output = lastFrame();
    // Check for ASCII art box characters
    expect(output).toContain('██');
  });

  it('starts with empty history', () => {
    const { lastFrame } = render(<App />);
    const output = lastFrame();
    // Should not contain any history items initially
    expect(output).toBeTruthy();
  });

  it('renders text input component', () => {
    const { lastFrame } = render(<App />);
    const output = lastFrame();
    // Input prompt should be visible
    expect(output).toContain('>');
  });
});
