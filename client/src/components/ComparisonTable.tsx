import React, { useMemo, useState } from 'react';
import type { ResponseResult } from '@shared/types';
import { BarChart3, ChevronDown, ChevronUp, Copy, Download, FileJson, RotateCcw, Search, Trash2, X } from 'lucide-react';

interface Props {
  experiments: ResponseResult[];
  onClear: () => void;
  onCopyResponse: (responseText: string) => void;
  onReuse: (experiment: ResponseResult) => void;
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

const exportFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
};

const toCsv = (experiments: ResponseResult[]) => {
  const headers = [
    'timestamp',
    'provider',
    'prompt',
    'enabled_layers',
    'response',
    'latency_ms',
    'tokens',
    'estimated_cost_cent',
    'overall',
    'relevance',
    'coherence',
    'completeness',
    'hallucination_risk',
    'instruction_adherence',
  ];

  const rows = experiments.map(exp => [
    exp.timestamp,
    exp.providerId,
    exp.prompt,
    exp.contextConfig.layers.filter(layer => layer.enabled).map(layer => layer.name).join('; '),
    exp.responseText,
    exp.responseTimeMs,
    exp.tokenCount,
    exp.estimatedCostCent,
    exp.evaluation?.overall ?? '',
    exp.evaluation?.relevance ?? '',
    exp.evaluation?.coherence ?? '',
    exp.evaluation?.completeness ?? '',
    exp.evaluation?.hallucinationRisk ?? '',
    exp.evaluation?.instructionAdherence ?? '',
  ]);

  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
};

const timestampSlug = () => new Date().toISOString().replace(/[:.]/g, '-');

export const ComparisonTable: React.FC<Props> = ({ experiments, onClear, onCopyResponse, onReuse }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');

  const providerIds = useMemo(
    () => Array.from(new Set(experiments.map(exp => exp.providerId))).sort(),
    [experiments]
  );

  const filteredExperiments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return experiments.filter(exp => {
      const matchesProvider = providerFilter === 'all' || exp.providerId === providerFilter;
      if (!matchesProvider) return false;

      if (!normalizedQuery) return true;

      const enabledLayerText = exp.contextConfig.layers
        .filter(layer => layer.enabled)
        .map(layer => `${layer.name} ${layer.content}`)
        .join(' ');

      return [
        exp.prompt,
        exp.responseText,
        exp.providerId,
        enabledLayerText,
        exp.evaluation?.overall,
        exp.evaluation?.instructionAdherence,
      ].some(value => String(value ?? '').toLowerCase().includes(normalizedQuery));
    });
  }, [experiments, providerFilter, query]);

  const hasFilters = query.trim() !== '' || providerFilter !== 'all';

  if (experiments.length === 0) return null;

  return (
    <section className="panel comparison-panel">
      <div className="section-title table-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.7rem' }}>
          <div className="section-title__icon"><BarChart3 size={18} /></div>
          <div>
            <h2>Comparative Analysis</h2>
            <p>
              {filteredExperiments.length} of {experiments.length} run{experiments.length !== 1 ? 's' : ''} shown
            </p>
          </div>
        </div>
        <div className="table-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => exportFile(`contextum-runs-${timestampSlug()}.json`, JSON.stringify(filteredExperiments, null, 2), 'application/json')}
            disabled={filteredExperiments.length === 0}
            title="Export shown runs as JSON"
          >
            <FileJson size={14} /> JSON
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => exportFile(`contextum-runs-${timestampSlug()}.csv`, toCsv(filteredExperiments), 'text/csv')}
            disabled={filteredExperiments.length === 0}
            title="Export shown runs as CSV"
          >
            <Download size={14} /> CSV
          </button>
          <button className="btn btn--ghost btn--sm" onClick={onClear} title="Clear all runs">
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="history-filters" aria-label="Filter saved runs">
        <label className="history-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search prompt, response, layers, or score..."
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <select
          className="history-provider-filter"
          value={providerFilter}
          onChange={event => setProviderFilter(event.target.value)}
          aria-label="Filter by provider"
        >
          <option value="all">All providers</option>
          {providerIds.map(providerId => (
            <option key={providerId} value={providerId}>{providerId}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setQuery('');
              setProviderFilter('all');
            }}
          >
            <X size={14} /> Reset filters
          </button>
        )}
      </div>

      <div className="table-wrap">
        {filteredExperiments.length === 0 ? (
          <div className="empty-state history-empty">
            <Search size={24} />
            <p>No saved runs match these filters.</p>
          </div>
        ) : (
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
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredExperiments.map(exp => {
              const pc = PROVIDER_COLORS[exp.providerId] ?? PROVIDER_COLORS.together;
              const score = exp.evaluation?.overall;
              const scoreColor = score == null ? '#475569' : score >= 80 ? '#34d399' : score >= 55 ? '#fbbf24' : '#fb7185';

              const isExpanded = expandedId === exp.id;

              return (
                <React.Fragment key={exp.id}>
                <tr className={isExpanded ? 'history-row history-row--active' : 'history-row'}>
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
                  <td>
                    <button
                      className="icon-btn history-expand"
                      onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                      title={isExpanded ? 'Collapse response' : 'View full response'}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="history-detail-row">
                    <td colSpan={8}>
                      <div className="history-detail">
                        <div className="history-detail__head">
                          <div>
                            <strong>Full response</strong>
                            <span>{exp.prompt}</span>
                          </div>
                          <div className="history-detail__actions">
                            <button className="btn btn--ghost btn--sm" onClick={() => onCopyResponse(exp.responseText)}>
                              <Copy size={13} /> Copy
                            </button>
                            <button className="btn btn--secondary btn--sm" onClick={() => onReuse(exp)}>
                              <RotateCcw size={13} /> Reuse setup
                            </button>
                          </div>
                        </div>
                        <div className="history-response">{exp.responseText}</div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
