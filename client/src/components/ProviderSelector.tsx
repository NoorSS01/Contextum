import React from 'react';
import { ProviderId } from '@shared/types';
import { Cpu } from 'lucide-react';

const PROVIDERS: { id: ProviderId; name: string; color: string }[] = [
  { id: 'openai',    name: 'OpenAI GPT-4o',           color: '#10a37f' },
  { id: 'google',    name: 'Google Gemini 1.5 Pro',   color: '#4285f4' },
  { id: 'anthropic', name: 'Anthropic Claude 3.5',    color: '#d19a66' },
  { id: 'cohere',    name: 'Cohere Command R+',        color: '#39a8e6' },
  { id: 'mistral',   name: 'Mistral Large',            color: '#ff6f59' },
  { id: 'groq',      name: 'Groq Llama 3 70B',         color: '#f74437' },
  { id: 'together',  name: 'Together Llama 3 70B',     color: '#94a3b8' },
];

interface Props {
  selectedId: ProviderId;
  onSelect: (id: ProviderId) => void;
}

export const ProviderSelector: React.FC<Props> = ({ selectedId, onSelect }) => {
  const current = PROVIDERS.find(p => p.id === selectedId);

  return (
    <label className="provider-selector">
      <Cpu size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <div className="dot" style={{ background: current?.color ?? '#38bdf8' }} />
      <select
        value={selectedId}
        onChange={e => onSelect(e.target.value as ProviderId)}
        aria-label="Select AI provider"
      >
        {PROVIDERS.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
};
