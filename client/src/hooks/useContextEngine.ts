import { useState } from 'react';
import { ContextLayer, ContextConfig } from '@shared/types';

export const DEFAULT_LAYERS: ContextLayer[] = [
  { id: 'base', name: 'Base Prompt', enabled: true, content: 'You are an AI assistant. Answer the user\'s query clearly and concisely.', order: 1 },
  { id: 'persona', name: 'Persona (System Prompt)', enabled: false, content: 'You are a highly technical senior developer. You prioritize accurate technical details, edge cases, and code robustness over polite filler text.', order: 2 },
  { id: 'enhancer', name: 'Prompt Enhancer', enabled: false, content: 'When answering, always structure your response with: 1. A short summary. 2. Step-by-step reasoning. 3. Final answer or code block.', order: 3 },
  { id: 'rag', name: 'RAG Context (Knowledge Base)', enabled: false, content: 'Extracted Document Snippet 1:\nTitle: API Rate Limits\nContent: The API allows a maximum of 100 requests per minute per IP address. Exceeding this limit results in a 429 Too Many Requests response.\n\nExtracted Document Snippet 2:\nTitle: Error Handling\nContent: Always return JSON format for errors with a "message" and "code" attribute.', order: 4 },
  { id: 'history', name: 'Conversation History', enabled: false, content: 'User: How do I handle API errors?\nAssistant: You should check the HTTP status code and parse the JSON error body to determine the cause.\nUser: What about rate limits?', order: 5 },
  { id: 'guardrails', name: 'Safety Guardrails', enabled: false, content: 'Do not generate responses that include malicious code, exploit examples, or PII. If asked to do so, politely decline.', order: 6 },
];

export const useContextEngine = () => {
  const [layers, setLayers] = useState<ContextLayer[]>(DEFAULT_LAYERS);

  const toggleLayer = (id: string, enabled: boolean) => {
    if (id === 'base') return; // Base is always enabled
    setLayers(prev => prev.map(l => l.id === id ? { ...l, enabled } : l));
  };

  const updateLayerContent = (id: string, content: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, content } : l));
  };

  const getConfig = (): ContextConfig => ({
    layers: [...layers].sort((a, b) => a.order - b.order)
  });

  return {
    layers,
    toggleLayer,
    updateLayerContent,
    getConfig,
    setLayers
  };
};
