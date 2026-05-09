import React from 'react';
import { ProviderId } from '@shared/types';
import { Cpu } from 'lucide-react';

const PROVIDERS: { id: ProviderId; name: string }[] = [
  { id: 'openai', name: 'OpenAI (GPT-4o)' },
  { id: 'google', name: 'Google (Gemini 2.5 Flash)' },
  { id: 'anthropic', name: 'Anthropic (Claude 3.5 Sonnet)' },
  { id: 'cohere', name: 'Cohere (Command R+)' },
  { id: 'mistral', name: 'Mistral (Large)' },
  { id: 'groq', name: 'Groq (Llama 3 70B)' },
  { id: 'together', name: 'Together (Llama 3 70B)' },
];

interface Props {
  selectedId: ProviderId;
  onSelect: (id: ProviderId) => void;
}

export const ProviderSelector: React.FC<Props> = ({ selectedId, onSelect }) => {
  return (
    <label className="provider-selector">
      <Cpu size={18} />
      <span>Model</span>
      <select 
        value={selectedId} 
        onChange={(e) => onSelect(e.target.value as ProviderId)}
      >
        {PROVIDERS.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
};
