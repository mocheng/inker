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

export function getSystemPrompt(): string {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const configPath = path.join(__dirname, '..', '..', 'config.toml');
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = toml.parse(content) as Config;
  
  const agentsPath = path.join(process.cwd(), 'AGENTS.md');
  const agentsContent = fs.readFileSync(agentsPath, 'utf-8').trim();
  
  cachedSystemPrompt = config.system.prompt.replace('{{AGENTS}}', agentsContent);
  return cachedSystemPrompt;
}
