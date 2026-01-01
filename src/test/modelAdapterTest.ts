import { ModelAdapter } from '../model/modelAdapter.js';
import { Message } from 'multi-llm-ts';

/**
 * Example: Testing sendMessage logic without calling Gemini API
 * 
 * You can inject a custom ModelAdapter to test:
 * - Message formatting
 * - Streaming behavior
 * - Tool call handling
 * - Error handling
 */

class TestModelAdapter implements ModelAdapter {
  constructor(private responses: any[]) {}
  
  async *generate(messages: any[]): AsyncGenerator<any> {
    // You can inspect messages here for testing
    console.log('Messages received:', messages.length);
    
    for (const response of this.responses) {
      yield response;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// Example test scenario
async function testStreamingWithMockAdapter() {
  const mockAdapter = new TestModelAdapter([
    { type: 'content', text: 'Hello ' },
    { type: 'content', text: 'from ' },
    { type: 'content', text: 'test!' },
  ]);

  let fullText = '';
  for await (const chunk of mockAdapter.generate([new Message('user', 'test')])) {
    if (chunk.type === 'content') {
      fullText += chunk.text;
    }
  }
  
  console.log('Result:', fullText); // "Hello from test!"
}

// Run with: npx tsx src/test/modelAdapterTest.ts
testStreamingWithMockAdapter();
