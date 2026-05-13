import React from 'react';
import { EvaluationMetrics } from '@shared/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  metrics: EvaluationMetrics | null;
  loading: boolean;
}

const METRIC_META = [
  { key: 'relevance',           label: 'Relevance',    color: '#38bdf8' },
  { key: 'coherence',           label: 'Coherence',    color: '#34d399' },
  { key: 'completeness',        label: 'Completeness', color: '#a78bfa' },
  { key: 'instructionAdherence',label: 'Adherence',    color: '#fb923c' },
  { key: 'hallucinationRisk',   label: 'Hallucination',color: '#fb7185' },
];

export const EvaluationScore: React.FC<Props> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="eval-skeleton">
        {[70, 55, 80, 45, 60].map((w, i) => (
          <div key={i} className="skeleton-bar" style={{ width: `${w}%` }} />
        ))}
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '.78rem', marginTop: '.25rem' }}>
          Evaluating response…
        </p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="empty-state">
        <TrendingUp size={24} />
        <p>Run a generation to see quality scores.</p>
      </div>
    );
  }

  const scoreColor =
    metrics.overall >= 80 ? '#34d399' :
    metrics.overall >= 55 ? '#fbbf24' : '#fb7185';

  const data = METRIC_META.map(m => ({
    name: m.label,
    value: metrics[m.key as keyof EvaluationMetrics] as number,
    color: m.color,
  }));

  return (
    <div className="eval-card">
      <div
        className="score-ring"
        style={{ '--score': metrics.overall, '--ring-color': scoreColor } as React.CSSProperties}
      >
        <div className="score-ring__inner">
          <span className="score-ring__value" style={{ color: scoreColor }}>{metrics.overall}</span>
          <span className="score-ring__label">/ 100</span>
        </div>
      </div>
      <div className="eval-bars">
        <div className="eval-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                dataKey="name" type="category"
                axisLine={false} tickLine={false} width={90}
                tick={{ fill: 'var(--text-2)', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,.04)' }}
                contentStyle={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: '8px', fontSize: '13px', color: 'var(--text-1)',
                }}
                formatter={(value: unknown) => [`${value}/100`]}
              />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={14} isAnimationActive animationDuration={600}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
