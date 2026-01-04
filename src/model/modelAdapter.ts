import { Message } from 'multi-llm-ts';

export interface Chunk {
  type: 'content' | 'tool';
  text?: string;
  name?: string;
  state?: 'running' | 'completed';
  status?: string;
  result?: string | null;
  id?: string;
}

export interface ModelAdapter {
  generate(messages: Message[]): AsyncGenerator<Chunk>;
}

export class MockModelAdapter implements ModelAdapter {
  async *generate(messages: Message[]): AsyncGenerator<Chunk> {
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage?.content === 'string' 
      ? lastMessage.content 
      : String(lastMessage?.content || '');
    
    // Detect tool call request
    if (prompt.toLowerCase().includes('use tool ls')) {
      yield { 
        type: 'tool',
        name: 'bash',
        state: 'running',
        status: 'Executing ls command'
      };
      
      // This will trigger actual tool execution in sendMessage()
      yield {
        type: 'tool',
        name: 'bash',
        state: 'completed',
        status: 'Command completed',
        result: null, // Will be filled by actual tool execution
        id: 'mock-tool-1'
      };
    } else {
      yield { type: 'content', text: 'I am a mock AI assistant. ' };
      yield { type: 'content', text: 'This simulates the model.generate() behavior. ' };
      yield { type: 'content', text: `You said: "${prompt.substring(0, 50)}..." ` };
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
