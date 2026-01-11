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
});
