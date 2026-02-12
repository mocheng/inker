import { describe, it, expect, beforeEach } from 'vitest';
import {
  isDangerousCommand,
  isDangerousRemoveCommand,
  requiresConfirmation,
  getDangerWarning,
  setSafetyConfig,
  getSafetyConfig,
  isPathAllowed,
  validateCommand,
} from '../security.js';

describe('Dangerous Command Detection', () => {
  it('detects rm -rf commands as dangerous', () => {
    expect(isDangerousRemoveCommand('rm -rf /')).toBe(true);
    expect(isDangerousRemoveCommand('rm -rf /home')).toBe(true);
    expect(isDangerousRemoveCommand('rm -f file.txt')).toBe(true);
  });

  it('does not flag safe rm commands as dangerous', () => {
    expect(isDangerousRemoveCommand('rm file.txt')).toBe(false);
    expect(isDangerousRemoveCommand('ls -la')).toBe(false);
  });

  it('detects dangerous patterns', () => {
    expect(isDangerousCommand('dd if=/dev/zero of=/dev/sda')).toBe(true);
    expect(isDangerousCommand('mkfs.ext4 /dev/sda1')).toBe(true);
    expect(isDangerousCommand(':(){:|:&};:')).toBe(true);
    expect(isDangerousCommand('chmod 777 /etc/passwd')).toBe(true);
  });

  it(' detects commands requiring confirmation', () => {
    expect(requiresConfirmation('rm -rf /')).toBe(true);
    expect(requiresConfirmation('dd if=/dev/zero of=/dev/sda')).toBe(true);
    expect(requiresConfirmation('ls -la')).toBe(false);
  });
});

describe('Warning Messages', () => {
  it('returns appropriate warning for rm -rf', () => {
    const warning = getDangerWarning('rm -rf /');
    expect(warning).toContain('permanently delete');
  });

  it('returns appropriate warning for dd command', () => {
    const warning = getDangerWarning('dd if=/dev/zero');
    expect(warning).toContain('overwrite disk');
  });

  it('returns generic warning for unknown dangerous patterns', () => {
    const warning = getDangerWarning('format c:');
    expect(warning).toContain('Potentially dangerous');
  });
});

describe('Safety Configuration', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    setSafetyConfig({ confirmDangerousCommands: true });
  });

  it('has default configuration', () => {
    const config = getSafetyConfig();
    expect(config.confirmDangerousCommands).toBe(true);
    expect(config.allowedPaths).toBeUndefined();
    expect(config.blockedPaths).toBeUndefined();
  });

  it('updates safety configuration', () => {
    setSafetyConfig({ confirmDangerousCommands: false });
    const config = getSafetyConfig();
    expect(config.confirmDangerousCommands).toBe(false);
  });

  it('supports allowed paths whitelist', () => {
    setSafetyConfig({ allowedPaths: ['/safe/path'] });
    const config = getSafetyConfig();
    expect(config.allowedPaths).toEqual(['/safe/path']);
  });

  it('supports blocked paths blacklist', () => {
    setSafetyConfig({ blockedPaths: ['/dangerous/path'] });
    const config = getSafetyConfig();
    expect(config.blockedPaths).toEqual(['/dangerous/path']);
  });
});

describe('Path Validation', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    setSafetyConfig({ 
      confirmDangerousCommands: true,
      allowedPaths: undefined,
      blockedPaths: undefined
    });
  });

  it('allows all paths when no whitelist is set', () => {
    expect(isPathAllowed('/any/path')).toBe(true);
    expect(isPathAllowed('/root')).toBe(true);
  });

  it('allows whitelisted paths', () => {
    setSafetyConfig({ allowedPaths: ['/home/user'] });
    expect(isPathAllowed('/home/user/file.txt')).toBe(true);
    expect(isPathAllowed('/other/file.txt')).toBe(false);
  });

  it('blocks blacklisted paths', () => {
    setSafetyConfig({ blockedPaths: ['/system'] });
    expect(isPathAllowed('/system/file')).toBe(false);
    expect(isPathAllowed('/home/file')).toBe(true);
  });

  it('blacklist takes precedence over whitelist', () => {
    setSafetyConfig({ 
      allowedPaths: ['/home', '/system'],
      blockedPaths: ['/system'] 
    });
    expect(isPathAllowed('/home/file')).toBe(true);
    expect(isPathAllowed('/system/file')).toBe(false);
  });
});

describe('Command Validation', () => {
  beforeEach(() => {
    setSafetyConfig({ confirmDangerousCommands: true });
  });

  it('marks safe commands as valid', () => {
    const result = validateCommand('ls -la');
    expect(result.safe).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('marks dangerous commands as requiring action', () => {
    const result = validateCommand('rm -rf /home');
    expect(result.safe).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('skips confirmation when disabled', () => {
    setSafetyConfig({ confirmDangerousCommands: false });
    const result = validateCommand('rm -rf /home');
    expect(result.safe).toBe(true);
  });
});
