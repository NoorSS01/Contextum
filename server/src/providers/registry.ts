import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createCohere } from '@ai-sdk/cohere';
import { createMistral } from '@ai-sdk/mistral';
import type { ProviderId } from '@shared/types';

export interface ProviderKeys {
  openai?: string;
  google?: string;
  anthropic?: string;
  cohere?: string;
  mistral?: string;
  groq?: string;
  together?: string;
}

const getProviderKey = (
  keys: ProviderKeys | undefined,
  providerId: ProviderId,
  envNames: string[]
) => {
  return keys?.[providerId] || envNames.map(name => process.env[name]).find(Boolean);
};

export const getModel = (providerId: ProviderId, keys?: ProviderKeys) => {
  switch (providerId) {
    case 'openai':
      {
        const apiKey = getProviderKey(keys, providerId, ['OPENAI_API_KEY']);
        if (!apiKey) throw new Error('OpenAI key required');
        return createOpenAI({ apiKey })('gpt-4o');
      }
    
    case 'google':
      {
        const apiKey = getProviderKey(keys, providerId, ['GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY']);
        if (!apiKey) throw new Error('Google Generative AI key required');
        return createGoogleGenerativeAI({ apiKey })('gemini-2.5-flash');
      }
      
    case 'anthropic':
      {
        const apiKey = getProviderKey(keys, providerId, ['ANTHROPIC_API_KEY']);
        if (!apiKey) throw new Error('Anthropic key required');
        return createAnthropic({ apiKey })('claude-3-5-sonnet-20240620');
      }
      
    case 'cohere':
      {
        const apiKey = getProviderKey(keys, providerId, ['COHERE_API_KEY']);
        if (!apiKey) throw new Error('Cohere key required');
        return createCohere({ apiKey })('command-r-plus');
      }
      
    case 'mistral':
      {
        const apiKey = getProviderKey(keys, providerId, ['MISTRAL_API_KEY']);
        if (!apiKey) throw new Error('Mistral key required');
        return createMistral({ apiKey })('mistral-large-latest');
      }
      
    case 'groq': // Groq provides an OpenAI-compatible API
      {
        const apiKey = getProviderKey(keys, providerId, ['GROQ_API_KEY']);
        if (!apiKey) throw new Error('Groq key required');
        return createOpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })('llama3-70b-8192');
      }
      
    case 'together': // Together provides an OpenAI-compatible API
      {
        const apiKey = getProviderKey(keys, providerId, ['TOGETHER_API_KEY']);
        if (!apiKey) throw new Error('Together AI key required');
        return createOpenAI({ apiKey, baseURL: 'https://api.together.xyz/v1' })('meta-llama/Llama-3-70b-chat-hf');
      }
      
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
};
