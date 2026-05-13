import React from 'react';
import { ScenarioPreset } from '@shared/types';
import { UserRound, Code2, Megaphone, BrainCircuit } from 'lucide-react';

const SCENARIO_META: Record<string, { icon: React.ReactNode; gradient: string; accent: string }> = {
  'angry-customer': {
    icon: <UserRound size={20} />,
    gradient: 'linear-gradient(135deg, rgba(251,113,133,0.15) 0%, rgba(251,113,133,0.03) 100%)',
    accent: '#fb7185',
  },
  'tech-debugger': {
    icon: <Code2 size={20} />,
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.03) 100%)',
    accent: '#38bdf8',
  },
  'sales-pitch': {
    icon: <Megaphone size={20} />,
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.03) 100%)',
    accent: '#34d399',
  },
  'interview-prep': {
    icon: <BrainCircuit size={20} />,
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0.03) 100%)',
    accent: '#a78bfa',
  },
};

interface Props {
  scenarios: ScenarioPreset[];
  activeScenarioId: string | null;
  onSelect: (scenario: ScenarioPreset) => void;
}

export const ScenarioCards: React.FC<Props> = ({ scenarios, activeScenarioId, onSelect }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '0.65rem',
    }}>
      {scenarios.map(scenario => {
        const meta = SCENARIO_META[scenario.id];
        const isActive = activeScenarioId === scenario.id;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            type="button"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              background: isActive ? meta?.gradient ?? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.028)',
              border: `1px solid ${isActive ? (meta?.accent ?? '#38bdf8') + '55' : 'rgba(148,163,184,0.14)'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              color: '#f8fafc',
              outline: isActive ? `2px solid ${meta?.accent ?? '#38bdf8'}40` : 'none',
              outlineOffset: '2px',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.055)';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.28)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.028)';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.14)';
              }
            }}
          >
            <div style={{
              width: '32px', height: '32px',
              display: 'grid', placeItems: 'center',
              borderRadius: '8px',
              background: `${meta?.accent ?? '#38bdf8'}18`,
              border: `1px solid ${meta?.accent ?? '#38bdf8'}30`,
              color: meta?.accent ?? '#38bdf8',
              flexShrink: 0,
            }}>
              {meta?.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                {scenario.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                {scenario.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
