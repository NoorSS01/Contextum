import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createCohere } from '@ai-sdk/cohere';
import { createMistral } from '@ai-sdk/mistral';
import { ProviderId } from '@shared/types';
import { CoreMessage } from 'ai';

export interface ProviderKeys {
  openai?: string;
  google?: string;
  anthropic?: string;
  cohere?: string;
  mistral?: string;
  groq?: string;
  together?: string;
}

export const getModel = (providerId: ProviderId, keys: ProviderKeys) => {
  switch (providerId) {
    case 'openai':
      if (!keys.openai) throw new Error('OpenAI key required');
      return createOpenAI({ apiKey: keys.openai })('gpt-4o');
    
    case 'google':
      if (!keys.google) throw new Error('Google Generative AI key required');
      return createGoogleGenerativeAI({ apiKey: keys.google })('gemini-1.5-pro-latest');
      
    case 'anthropic':
      if (!keys.anthropic) throw new Error('Anthropic key required');
      return createAnthropic({ apiKey: keys.anthropic })('claude-3-5-sonnet-20240620');
      
    case 'cohere':
      if (!keys.cohere) throw new Error('Cohere key required');
      return createCohere({ apiKey: keys.cohere })('command-r-plus');
      
    case 'mistral':
      if (!keys.mistral) throw new Error('Mistral key required');
      return createMistral({ apiKey: keys.mistral })('mistral-large-latest');
      
    case 'groq': // Groq provides an OpenAI-compatible API
      if (!keys.groq) throw new Error('Groq key required');
      return createOpenAI({ apiKey: keys.groq, baseURL: 'https://api.groq.com/openai/v1' })('llama3-70b-8192');
      
    case 'together': // Together provides an OpenAI-compatible API
      if (!keys.together) throw new Error('Together AI key required');
      return createOpenAI({ apiKey: keys.together, baseURL: 'https://api.together.xyz/v1' })('meta-llama/Llama-3-70b-chat-hf');
      
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
};
