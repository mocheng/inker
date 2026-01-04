import fs from 'fs';
import path from 'path';
import toml from 'toml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
  system: {
    prompt: string;
  };
}

let cachedSystemPrompt: string | null = null;

function getConfigPath(): string {
  return path.join(__dirname, '..', '..', 'config.toml');
}

function getAgentsPath(): string {
  // Try current working directory first
  const cwdPath = path.join(process.cwd(), 'AGENTS.md');
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }
  
  // Fallback to project root (relative to config file)
  const projectRootPath = path.join(__dirname, '..', '..', 'AGENTS.md');
  if (fs.existsSync(projectRootPath)) {
    return projectRootPath;
  }
  
  // Return cwd path as default (will error if file doesn't exist)
  return cwdPath;
}

function readConfigFile(configPath: string): Config {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return toml.parse(content) as Config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read config file: ${error.message}`);
    }
    throw new Error('Failed to read config file: Unknown error');
  }
}

function readAgentsFile(agentsPath: string): string {
  try {
    if (!fs.existsSync(agentsPath)) {
      // Return empty string if AGENTS.md doesn't exist (optional file)
      return '';
    }
    const content = fs.readFileSync(agentsPath, 'utf-8');
    return content.trim();
  } catch (error) {
    // Log warning but don't fail - AGENTS.md is optional
    console.warn(`Warning: Could not read AGENTS.md from ${agentsPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return '';
  }
}

export function getSystemPrompt(): string {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  try {
    const configPath = getConfigPath();
    const config = readConfigFile(configPath);
    
    if (!config.system?.prompt) {
      throw new Error('System prompt not found in config file');
    }
    
    const agentsPath = getAgentsPath();
    const agentsContent = readAgentsFile(agentsPath);
    
    cachedSystemPrompt = config.system.prompt.replace('{{AGENTS}}', agentsContent);
    return cachedSystemPrompt;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load system prompt: ${errorMessage}`);
  }
}
