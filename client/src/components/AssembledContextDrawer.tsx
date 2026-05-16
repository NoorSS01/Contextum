import React, { useRef, useEffect } from 'react';
import { X, Copy, Layers, ChevronRight, Database, MessageSquare, Shield, Wand2, User2, FileText } from 'lucide-react';
import { ContextConfig } from '@shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contextConfig: ContextConfig;
  assembledMessages: { role: string; content: string }[];
}

const LAYER_ICONS: Record<string, React.ReactNode> = {
  base: <FileText size={14} />,
  persona: <User2 size={14} />,
  enhancer: <Wand2 size={14} />,
  rag: <Database size={14} />,
  history: <MessageSquare size={14} />,
  guardrails: <Shield size={14} />,
};

const LAYER_COLORS: Record<string, string> = {
  base: '#38bdf8',
  persona: '#a78bfa',
  enhancer: '#34d399',
  rag: '#f59e0b',
  history: '#fb923c',
  guardrails: '#f87171',
};

export const AssembledContextDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  contextConfig,
  assembledMessages,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const copyAll = () => {
    const text = assembledMessages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const enabledLayers = contextConfig.layers.filter(l => l.enabled);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 60,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(600px, 100vw)',
          background: 'linear-gradient(180deg, #111722 0%, #0d1118 100%)',
          borderLeft: '1px solid rgba(148,163,184,0.14)',
          zIndex: 61,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          position: 'sticky',
          top: 0,
          background: 'rgba(13,17,24,0.95)',
          backdropFilter: 'blur(12px)',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(56,189,248,0.25)',
              display: 'grid', placeItems: 'center',
              color: '#38bdf8',
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Assembled Context</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                {enabledLayers.length} active layers - {assembledMessages.length} messages
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={copyAll}
              title="Copy all"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '7px', color: '#94a3b8',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Copy size={14} /> Copy All
            </button>
            <button
              onClick={onClose}
              style={{
                width: '36px', height: '36px',
                display: 'grid', placeItems: 'center',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', cursor: 'pointer', color: '#94a3b8',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Layer Pills */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Active Layers</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {enabledLayers.map(l => (
              <span key={l.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: `${LAYER_COLORS[l.id] ?? '#64748b'}18`,
                border: `1px solid ${LAYER_COLORS[l.id] ?? '#64748b'}40`,
                color: LAYER_COLORS[l.id] ?? '#94a3b8',
                fontSize: '0.75rem', fontWeight: 600,
              }}>
                {LAYER_ICONS[l.id]} {l.name}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assembledMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <Layers size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No context assembled yet.<br />Enable some layers and run a generation.</p>
            </div>
          ) : (
            assembledMessages.map((msg, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ChevronRight size={14} style={{ color: '#64748b' }} />
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    background: msg.role === 'system' ? 'rgba(56,189,248,0.12)' : msg.role === 'assistant' ? 'rgba(167,139,250,0.12)' : 'rgba(52,211,153,0.12)',
                    border: `1px solid ${msg.role === 'system' ? 'rgba(56,189,248,0.25)' : msg.role === 'assistant' ? 'rgba(167,139,250,0.25)' : 'rgba(52,211,153,0.25)'}`,
                    color: msg.role === 'system' ? '#38bdf8' : msg.role === 'assistant' ? '#a78bfa' : '#34d399',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {msg.role}
                  </span>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '0.875rem 1rem',
                  background: 'rgba(8,11,16,0.6)',
                  border: '1px solid rgba(148,163,184,0.1)',
                  borderRadius: '8px',
                  fontFamily: '"SFMono-Regular", Consolas, monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.7,
                  color: '#cbd5e1',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowX: 'auto',
                }}>
                  {msg.content}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
