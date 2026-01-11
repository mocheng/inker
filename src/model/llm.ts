import { streamText, LanguageModel, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';
import { throttle } from 'lodash-es';
import { getSystemPrompt } from '../config/config.js';
import { withSpan, logWithSpanCorrelation } from './tracing.js';
import { tools } from './tools/index.js';

dotenv.config({ quiet: true });

interface ProviderConfig {
  provider: string;
  modelName: string;
  model: LanguageModel;
}

let cachedConfig: ProviderConfig | null = null;
const useMock = process.env.USE_MOCK_MODEL === 'true';

function getProviderConfig(): ProviderConfig {
  if (cachedConfig) return cachedConfig;
  
  const provider = process.env.LLM_PROVIDER || 'google';
  
  if (provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    if (!apiKey) throw new Error('GEMINI_API_KEY not found in .env file');
    
    const google = createGoogleGenerativeAI({ apiKey });
    cachedConfig = { provider, modelName, model: google(modelName) };
    return cachedConfig;
  }
  
  if (provider === 'bedrock') {
    const region = process.env.AWS_REGION || 'us-east-1';
    const modelName = process.env.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    
    const bedrock = createAmazonBedrock({ 
      bedrockOptions: {
        region,
        credentials: fromNodeProviderChain()
      }
    });
    cachedConfig = { provider, modelName, model: bedrock(modelName) };
    return cachedConfig;
  }
  
  throw new Error(`Unsupported LLM_PROVIDER: ${provider}. Supported: google, bedrock`);
}

export async function sendMessage(
  message: string,
  conversationHistory: CoreMessage[],
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  const { provider, modelName, model } = getProviderConfig();
  
  if (useMock) {
    const mockResponse = 'Mock response';
    onChunk(mockResponse);
    return mockResponse;
  }
  
  return withSpan('llm.chat', {
    'gen_ai.system': provider,
    'gen_ai.request.model': modelName,
    'gen_ai.operation.name': 'chat'
  }, async (span) => {
    const messages: CoreMessage[] = [
      { role: 'system', content: getSystemPrompt() },
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    
    span.setAttribute('input-json', JSON.stringify({ message }));
    span.setAttribute('context-json', JSON.stringify({
      model: modelName,
      conversationLength: conversationHistory.length
    }));
    
    let fullResponse = '';
    let buffer = '';
    
    const flushBuffer = throttle(() => {
      if (buffer) {
        onChunk(buffer);
        buffer = '';
      }
    }, 100);
    
    logWithSpanCorrelation('info', 'gen_ai.generate.start', 'Starting streamText() call', {
      model: modelName,
      messageCount: messages.length,
    });
    
    try {
      const result = streamText({
        model,
        messages,
        tools,
        maxSteps: 10,
        abortSignal,
      });
      
      let hasReceivedData = false;
      
      // Stream text chunks
      for await (const textDelta of result.textStream) {
        hasReceivedData = true;
        fullResponse += textDelta;
        buffer += textDelta;
        flushBuffer();
      }
      
      if (!hasReceivedData && fullResponse === '') {
        throw new Error('No response received from LLM. Check your AWS region and model configuration.');
      }
      
      flushBuffer.flush();
      
      span.setAttribute('output-json', JSON.stringify({ response: fullResponse }));
      
      return fullResponse;
    } catch (error: any) {
      span.setAttribute('error', true);
      span.setAttribute('error.message', error.message || String(error));
      throw new Error(`LLM Error: ${error.message || String(error)}`);
    }
  });
}
