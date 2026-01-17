import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import Progress from '../Progress.js';

describe('Progress', () => {
  it('renders loading spinner', () => {
    const { lastFrame } = render(<Progress />);
    const output = lastFrame();
    expect(output).toBeTruthy();
    expect(output).toContain('⠋');
  });

  it('shows thinking message', () => {
    const { lastFrame } = render(<Progress />);
    const output = lastFrame();
    expect(output).toContain('Thinking');
  });

  it('shows elapsed time format', () => {
    const { lastFrame } = render(<Progress />);
    const output = lastFrame();
    expect(output).toMatch(/\d+s/); // Should contain time in seconds
  });
});
