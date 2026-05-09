import React, { useState } from 'react';
import { ContextLayer } from '@shared/types';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';

interface Props {
  layers: ContextLayer[];
  onToggle: (id: string, enabled: boolean) => void;
  onUpdateContent: (id: string, content: string) => void;
}

export const ContextPanel: React.FC<Props> = ({ layers, onToggle, onUpdateContent }) => {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLayer(expandedLayer === id ? null : id);
  };

  return (
    <div className="context-stack">
      {layers.map(layer => (
        <div key={layer.id} className={`context-layer ${layer.enabled ? 'context-layer--active' : ''}`}>
          <div className="context-layer__head">
            <button
              className="context-layer__summary"
              onClick={() => toggleExpand(layer.id)}
              type="button"
            >
              {expandedLayer === layer.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <div>
                <span>{layer.name}</span>
                <small>{layer.enabled ? 'Active' : 'Inactive'} · Priority {layer.order}</small>
              </div>
            </button>

            <div className="context-layer__actions">
              <button
                className="icon-button"
                onClick={() => toggleExpand(layer.id)}
                title="Edit content"
                type="button"
              >
                <Settings2 size={16} />
              </button>

              <label className={`switch ${layer.id === 'base' ? 'switch--locked' : ''}`}>
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  disabled={layer.id === 'base'}
                  onChange={(e) => onToggle(layer.id, e.target.checked)}
                />
                <span />
              </label>
            </div>
          </div>

          {expandedLayer === layer.id && (
            <div className="context-layer__editor">
              <textarea 
                value={layer.content}
                onChange={(e) => onUpdateContent(layer.id, e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
