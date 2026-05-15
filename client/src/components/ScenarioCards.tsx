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
    <div className="scenario-grid">
      {scenarios.map(scenario => {
        const meta = SCENARIO_META[scenario.id];
        const isActive = activeScenarioId === scenario.id;

        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            type="button"
            className={`scenario-card${isActive ? ' scenario-card--active' : ''}`}
            style={{
              '--scenario-accent': meta?.accent ?? '#38bdf8',
              '--scenario-bg': meta?.gradient ?? 'rgba(56,189,248,0.08)',
            } as React.CSSProperties}
          >
            <div className="scenario-card__icon">
              {meta?.icon}
            </div>
            <div className="scenario-card__body">
              <div className="scenario-card__title">
                {scenario.name}
              </div>
              <div className="scenario-card__description">
                {scenario.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
