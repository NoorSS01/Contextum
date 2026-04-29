import React from 'react';
import { ProviderId } from '@shared/types';
import { Cpu } from 'lucide-react';

const PROVIDERS: { id: ProviderId; name: string }[] = [
  { id: 'openai', name: 'OpenAI (GPT-4o)' },
  { id: 'google', name: 'Google (Gemini 1.5 Pro)' },
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
    <div className="flex items-center gap-2">
      <Cpu size={18} className="text-accent-primary" />
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Model:</span>
      <select 
        value={selectedId} 
        onChange={(e) => onSelect(e.target.value as ProviderId)}
        style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.75rem' }}
      >
        {PROVIDERS.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
};
