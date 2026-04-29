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

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3>Overall Score: <span style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>{metrics.overall}/100</span></h3>
      </div>
      
      <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fill: 'var(--text-primary)', fontSize: '0.8rem' }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
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
