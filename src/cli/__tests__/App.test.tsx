import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import App from '../App.js';
import * as gemini from '../../model/gemini.js';

vi.mock('../../model/gemini.js');

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input box', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('>');
  });
});
