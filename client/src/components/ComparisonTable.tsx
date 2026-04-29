import React from 'react';
import { ResponseResult } from '@shared/types';
import { Columns } from 'lucide-react';

interface Props {
  experiments: ResponseResult[];
}

export const ComparisonTable: React.FC<Props> = ({ experiments }) => {
  if (experiments.length === 0) return null;

  return (
    <div className="glass-panel p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Columns className="text-accent-primary" />
        <h2 style={{ margin: 0 }}>Comparative Analysis</h2>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="p-4">Time</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Context Config</th>
              <th className="p-4" style={{ width: '30%' }}>Response Excerpt</th>
              <th className="p-4">Generics</th>
              <th className="p-4">Scores</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map(exp => (
              <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="p-4" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(exp.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-4 font-semibold">{exp.providerId}</td>
                <td className="p-4 gap-1 flex-col">
                  {exp.contextConfig.layers.filter(l => l.enabled).map(l => (
                    <span key={l.id} style={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                      color: 'var(--accent-primary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      display: 'inline-block'
                    }}>
                      {l.name}
                    </span>
                  ))}
                </td>
                <td className="p-4">
                  <div style={{
                    maxHeight: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {exp.responseText.substring(0, 150)}...
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex-col gap-1" style={{ fontSize: '0.8rem' }}>
                    <span>{exp.responseTimeMs}ms</span>
                  </div>
                </td>
                <td className="p-4">
                  {exp.evaluation ? (
                    <div className="flex items-center gap-2">
                       <div style={{ 
                         width: '40px', height: '40px', 
                         borderRadius: '50%', border: '2px solid',
                         borderColor: exp.evaluation.overall >= 80 ? 'var(--success)' : exp.evaluation.overall >= 50 ? 'var(--warning)' : 'var(--danger)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontWeight: 'bold', fontSize: '0.9rem'
                       }}>
                         {exp.evaluation.overall}
                       </div>
                       <div className="flex-col" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                         <span>Rel: {exp.evaluation.relevance}</span>
                         <span>Coh: {exp.evaluation.coherence}</span>
                         <span>Cmp: {exp.evaluation.completeness}</span>
                       </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
