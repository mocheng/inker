/**
 * Security utilities for potentially dangerous operations
 * Provides warning and confirmation prompts for risky commands
 */

/**
 * List of dangerous bash patterns that should be confirmed
 */
const DANGEROUS_PATTERNS = [
  'rm -rf /',
  'rm -rf /*',
  'rm -rf ~',
  'dd if=',      // disk wiping
  'mkfs.',       // filesystem formatting
  'rm ',         // removal commands (will be refined in validation)
  'del ',        // Windows deletion
  '> /dev/sd',   // directly writing to disk
  ':(){:|:&};:', // fork bomb
  'chmod 777',   // overly permissive permissions
  'chown -R',    // recursive ownership change
  'wipe',
  'shred',
];

/**
 * Check if a command is potentially dangerous
 */
export function isDangerousCommand(command: string): boolean {
  const trimmedCmd = command.toLowerCase().trim();
  
  return DANGEROUS_PATTERNS.some(pattern => 
    trimmedCmd.includes(pattern.toLowerCase())
  );
}

/**
 * Refine rm command danger detection
 * rm with -rf flag is dangerous, rm alone usually isn't
 */
export function isDangerousRemoveCommand(command: string): boolean {
  const trimmedCmd = command.toLowerCase().trim();
  
  // Check for rm -rf or rm -f patterns
  const rmPattern = /rm\s+-[rf]+/;
  if (rmPattern.test(trimmedCmd)) {
    return true;
  }
  
  // rm / or rm ~ are always dangerous
  if (trimmedCmd.includes('rm ') && 
      (trimmedCmd.includes(' /') || trimmedCmd.includes(' ~/') || trimmedCmd.includes('~$'))) {
    return true;
  }
  
  return false;
}

/**
 * Validate if a command requires confirmation
 * Combines multiple danger checks
 */
export function requiresConfirmation(command: string): boolean {
  return isDangerousRemoveCommand(command) || 
         DANGEROUS_PATTERNS.some(pattern => {
           if (pattern === 'rm ' || pattern === 'del ') {
             return false; // handled separately
           }
           return command.toLowerCase().includes(pattern.toLowerCase());
         });
}

/**
 * Generate warning message for dangerous command
 */
export function getDangerWarning(command: string): string {
  const warnings: Record<string, string> = {
    'rm -rf': '⚠️  This will permanently delete files',
    'dd if=': '⚠️  This can overwrite disk data',
    'mkfs.': '⚠️  This will format a filesystem',
    ':(){:|:&};:': '🚨  This is a fork bomb - will crash the system',
    'chmod 777': '⚠️  Setting 777 permissions is a security risk',
    'chown -R': '⚠️  Recursive ownership change - verify targets',
  };

  for (const [pattern, warning] of Object.entries(warnings)) {
    if (command.toLowerCase().includes(pattern.toLowerCase())) {
      return warning;
    }
  }

  return '⚠️  Potentially dangerous command - review carefully';
}

/**
 * Safety configuration
 */
export interface SafetyConfig {
  confirmDangerousCommands: boolean;
  allowedPaths?: string[]; // whitelist of safe paths
  blockedPaths?: string[]; // blacklist of blocked paths
}

/**
 * Default safety configuration
 */
const defaultConfig: SafetyConfig = {
  confirmDangerousCommands: true,
};

/**
 * Global safety configuration
 */
let safetyConfig: SafetyConfig = { ...defaultConfig };

/**
 * Set safety configuration
 */
export function setSafetyConfig(config: Partial<SafetyConfig>): void {
  safetyConfig = { ...safetyConfig, ...config };
}

/**
 * Get safety configuration
 */
export function getSafetyConfig(): SafetyConfig {
  return { ...safetyConfig };
}

/**
 * Check if a path is allowed
 */
export function isPathAllowed(filePath: string): boolean {
  const { allowedPaths, blockedPaths } = safetyConfig;
  
  // Check blocked paths first
  if (blockedPaths) {
    for (const blocked of blockedPaths) {
      if (filePath.includes(blocked)) {
        return false;
      }
    }
  }
  
  // If no allowed paths, everything else is allowed
  if (!allowedPaths || allowedPaths.length === 0) {
    return true;
  }
  
  // Check if path is in allowed list
  return allowedPaths.some(allowed => filePath.includes(allowed));
}

/**
 * Validate command safety
 */
export function validateCommand(command: string): { safe: boolean; reason?: string } {
  if (requiresConfirmation(command) && safetyConfig.confirmDangerousCommands) {
    return { 
      safe: false, 
      reason: getDangerWarning(command) 
    };
  }
  
  return { safe: true };
}
