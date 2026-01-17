import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import LoadingIcon from '../LoadingIcon.js';

describe('LoadingIcon', () => {
  it('renders initial spinner frame', () => {
    const { lastFrame } = render(<LoadingIcon />);
    const output = lastFrame();
    expect(output).toBeTruthy();
    expect(output).toMatch(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/);
  });

  it('renders a valid spinner character', () => {
    const { lastFrame } = render(<LoadingIcon />);
    const output = lastFrame();
    
    const validFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    expect(validFrames).toContain(output);
  });
});
