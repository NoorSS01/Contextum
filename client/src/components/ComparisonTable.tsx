import React from 'react';
import { ResponseResult } from '@shared/types';
import { Columns } from 'lucide-react';

interface Props {
  experiments: ResponseResult[];
}

export const ComparisonTable: React.FC<Props> = ({ experiments }) => {
  if (experiments.length === 0) return null;

  return (
    <section className="panel comparison-panel">
      <div className="section-title">
        <Columns size={20} />
        <div>
          <h2>Comparative Analysis</h2>
          <p>Recent runs with context stack, latency, and evaluator score.</p>
        </div>
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
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map(exp => (
              <tr key={exp.id}>
                <td>
                  {new Date(exp.timestamp).toLocaleTimeString()}
                </td>
                <td><span className="provider-chip">{exp.providerId}</span></td>
                <td>
                  <div className="layer-chip-row">
                  {exp.contextConfig.layers.filter(l => l.enabled).map(l => (
                    <span key={l.id} className="layer-chip">
                      {l.name}
                    </span>
                  ))}
                  </div>
                </td>
                <td>
                  <div className="response-excerpt">
                    {exp.responseText.substring(0, 150)}...
                  </div>
                </td>
                <td>{exp.responseTimeMs}ms</td>
                <td>
                  {exp.evaluation ? (
                    <div className="table-score">
                      <strong>{exp.evaluation.overall}</strong>
                      <span>Rel {exp.evaluation.relevance} · Adr {exp.evaluation.instructionAdherence}</span>
                    </div>
                  ) : (
                    <span className="muted">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
