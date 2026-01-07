let contextFiles: string[] = [];

export function getContextFiles(): string[] {
  return [...contextFiles];
}

export function addContextFile(path: string): void {
  if (!contextFiles.includes(path)) {
    contextFiles.push(path);
  }
}

export function removeContextFile(path: string): void {
  contextFiles = contextFiles.filter(f => f !== path);
}

export function clearContext(): void {
  contextFiles = [];
}
