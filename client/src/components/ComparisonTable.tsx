import React from 'react';
import { ResponseResult } from '@shared/types';
import { BarChart3, Trash2 } from 'lucide-react';

interface Props {
  experiments: ResponseResult[];
  onClear: () => void;
}

const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
  openai:    { bg: 'rgba(16,163,127,.15)',  color: '#10a37f' },
  google:    { bg: 'rgba(66,133,244,.15)',  color: '#4285f4' },
  anthropic: { bg: 'rgba(209,154,102,.15)', color: '#d19a66' },
  cohere:    { bg: 'rgba(57,168,230,.15)',  color: '#39a8e6' },
  mistral:   { bg: 'rgba(255,111,89,.15)',  color: '#ff6f59' },
  groq:      { bg: 'rgba(247,68,55,.15)',   color: '#f74437' },
  together:  { bg: 'rgba(100,116,139,.15)', color: '#94a3b8' },
};

export const ComparisonTable: React.FC<Props> = ({ experiments, onClear }) => {
  if (experiments.length === 0) return null;

  return (
    <section className="panel comparison-panel">
      <div className="section-title table-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.7rem' }}>
          <div className="section-title__icon"><BarChart3 size={18} /></div>
          <div>
            <h2>Comparative Analysis</h2>
            <p>{experiments.length} run{experiments.length !== 1 ? 's' : ''} saved locally</p>
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onClear} title="Clear all runs">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      <div className="table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Provider</th>
              <th>Context</th>
              <th>Response</th>
              <th>Latency</th>
              <th>Tokens</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map(exp => {
              const pc = PROVIDER_COLORS[exp.providerId] ?? PROVIDER_COLORS.together;
              const score = exp.evaluation?.overall;
              const scoreColor = score == null ? '#475569' : score >= 80 ? '#34d399' : score >= 55 ? '#fbbf24' : '#fb7185';

              return (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                    {new Date(exp.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className="provider-chip" style={{ background: pc.bg, color: pc.color }}>
                      {exp.providerId}
                    </span>
                  </td>
                  <td>
                    <div className="layer-chip-row">
                      {exp.contextConfig.layers.filter(l => l.enabled).map(l => (
                        <span key={l.id} className="layer-chip">{l.name.split(' ')[0]}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="response-excerpt">
                      {exp.responseText.substring(0, 140)}...
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{exp.responseTimeMs.toLocaleString()}ms</td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-2)' }}>
                    ~{exp.tokenCount.toLocaleString()}
                  </td>
                  <td>
                    {exp.evaluation ? (
                      <div className="table-score">
                        <strong style={{ color: scoreColor }}>{exp.evaluation.overall}</strong>
                        <span>Rel {exp.evaluation.relevance} - Adr {exp.evaluation.instructionAdherence}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: '.75rem' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
