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
    <div className="flex-col gap-2">
      {layers.map(layer => (
        <div key={layer.id} className="glass-panel" style={{ overflow: 'hidden' }}>
          <div 
            className="flex items-center justify-between p-4" 
            style={{ 
              backgroundColor: layer.enabled ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderBottom: expandedLayer === layer.id ? '1px solid var(--border-color)' : 'none',
              transition: 'background-color 0.2s',
              cursor: 'pointer'
            }}
          >
            <div className="flex items-center gap-3" onClick={() => toggleExpand(layer.id)} style={{ flex: 1 }}>
              {expandedLayer === layer.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span style={{ fontWeight: layer.enabled ? 600 : 400, color: layer.enabled ? '#fff' : 'var(--text-secondary)' }}>
                {layer.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleExpand(layer.id)} 
                style={{ background: 'transparent', padding: '0.25rem' }}
                title="Edit Content"
              >
                <Settings2 size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
              
              {/* Toggle Switch */}
              <label 
                style={{ 
                  position: 'relative', 
                  display: 'inline-block', 
                  width: '40px', 
                  height: '24px',
                  opacity: layer.id === 'base' ? 0.5 : 1,
                  cursor: layer.id === 'base' ? 'not-allowed' : 'pointer'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={layer.enabled} 
                  disabled={layer.id === 'base'}
                  onChange={(e) => onToggle(layer.id, e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }} 
                />
                <span style={{
                  position: 'absolute',
                  cursor: layer.id === 'base' ? 'not-allowed' : 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: layer.enabled ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  transition: '.4s',
                  borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    left: layer.enabled ? '20px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.2s',
                    borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>
          </div>

          {/* Expanded Content Editor */}
          {expandedLayer === layer.id && (
            <div className="p-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <textarea 
                value={layer.content}
                onChange={(e) => onUpdateContent(layer.id, e.target.value)}
                rows={4}
                style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
