import React, { useState } from 'react';
import { ContextLayer } from '@shared/types';
import { ChevronDown, ChevronRight, FileText, User2, Wand2, Database, MessageSquare, Shield } from 'lucide-react';

interface Props {
  layers: ContextLayer[];
  onToggle: (id: string, enabled: boolean) => void;
  onUpdateContent: (id: string, content: string) => void;
}

const LAYER_META: Record<string, { icon: React.ReactNode; color: string; orderBg: string }> = {
  base:       { icon: <FileText size={13} />,      color: '#38bdf8', orderBg: 'rgba(56,189,248,.18)' },
  persona:    { icon: <User2 size={13} />,          color: '#a78bfa', orderBg: 'rgba(167,139,250,.18)' },
  enhancer:   { icon: <Wand2 size={13} />,          color: '#34d399', orderBg: 'rgba(52,211,153,.18)' },
  rag:        { icon: <Database size={13} />,       color: '#f59e0b', orderBg: 'rgba(245,158,11,.18)' },
  history:    { icon: <MessageSquare size={13} />,  color: '#fb923c', orderBg: 'rgba(251,146,60,.18)' },
  guardrails: { icon: <Shield size={13} />,         color: '#fb7185', orderBg: 'rgba(251,113,133,.18)' },
};

export const ContextPanel: React.FC<Props> = ({ layers, onToggle, onUpdateContent }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded(p => p === id ? null : id);

  return (
    <div className="context-stack">
      {layers.map(layer => {
        const meta = LAYER_META[layer.id];
        const isOpen = expanded === layer.id;
        return (
          <div key={layer.id} className={`context-layer${layer.enabled ? ' context-layer--active' : ''}`}>
            <div className="context-layer__head">
              {/* Colored order badge */}
              <div className="context-layer__order" style={{ background: meta?.orderBg, color: meta?.color }}>
                {layer.order}
              </div>

              {/* Click the whole row header to expand */}
              <button
                className="context-layer__summary"
                onClick={() => toggle(layer.id)}
                type="button"
                aria-expanded={isOpen}
                aria-label={`${layer.name} — ${layer.enabled ? 'active' : 'inactive'}`}
              >
                <span className="context-layer__name" style={{ color: layer.enabled ? meta?.color : undefined }}>
                  <span className="layer-icon">{meta?.icon}</span>
                  {layer.name}
                </span>
                <span className="context-layer__meta">
                  {layer.enabled ? 'Active' : 'Inactive'} · {layer.content.length.toLocaleString()} chars
                </span>
              </button>

              {/* Actions: only expand chevron + toggle switch */}
              <div className="context-layer__actions">
                <button
                  className="icon-btn"
                  onClick={() => toggle(layer.id)}
                  title={isOpen ? 'Collapse' : 'Edit content'}
                  type="button"
                  aria-label={isOpen ? 'Collapse layer editor' : 'Expand layer editor'}
                  style={{ width: 28, height: 28 }}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <label className={`switch${layer.id === 'base' ? ' switch--locked' : ''}`} title={layer.id === 'base' ? 'Base layer is always active' : undefined}>
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    disabled={layer.id === 'base'}
                    onChange={e => onToggle(layer.id, e.target.checked)}
                    aria-label={`Toggle ${layer.name}`}
                  />
                  <span className="switch__track" />
                </label>
              </div>
            </div>

            {isOpen && (
              <div className="context-layer__editor">
                <textarea
                  value={layer.content}
                  onChange={e => onUpdateContent(layer.id, e.target.value)}
                  rows={5}
                  spellCheck={false}
                  placeholder={`Enter ${layer.name} content…`}
                  aria-label={`${layer.name} content`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
