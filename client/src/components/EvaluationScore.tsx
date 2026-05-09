import React from 'react';
import { EvaluationMetrics } from '@shared/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  metrics: EvaluationMetrics | null;
  loading: boolean;
}

export const EvaluationScore: React.FC<Props> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ color: 'var(--text-secondary)' }}>
        <div className="animate-pulse">Evaluating response quality...</div>
      </div>
    );
  }

  if (!metrics) {
    return <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No evaluation data available.</div>;
  }

  const data = [
    { name: 'Relevance', value: metrics.relevance, color: '#6366f1' },
    { name: 'Coherence', value: metrics.coherence, color: '#10b981' },
    { name: 'Completeness', value: metrics.completeness, color: '#3b82f6' },
    { name: 'Adherence', value: metrics.instructionAdherence, color: '#8b5cf6' },
    { name: 'Hallucination', value: metrics.hallucinationRisk, color: '#ef4444' },
  ];

  const scoreClass =
    metrics.overall >= 80 ? 'score-ring--good' : metrics.overall >= 50 ? 'score-ring--warn' : 'score-ring--bad';

  return (
    <div className="evaluation-card">
      <div
        className={`score-ring ${scoreClass}`}
        style={{ '--score': metrics.overall } as React.CSSProperties}
      >
        <strong>{metrics.overall}</strong>
        <span>/100</span>
      </div>
      <div className="evaluation-chart">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={104} style={{ fill: 'var(--text-primary)', fontSize: '0.78rem' }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
