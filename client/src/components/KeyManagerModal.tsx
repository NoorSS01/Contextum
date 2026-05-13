import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ProviderId } from '@shared/types';
import { saveKey, hasKeyStored, deleteKey } from '../services/keys';
import { KeyRound, Check, X, Trash2, Eye, EyeOff } from 'lucide-react';

const PROVIDERS: { id: ProviderId; name: string; placeholder: string }[] = [
  { id: 'openai',    name: 'OpenAI',          placeholder: 'sk-...' },
  { id: 'google',    name: 'Google Gemini',   placeholder: 'AIza...' },
  { id: 'anthropic', name: 'Anthropic Claude',placeholder: 'sk-ant-...' },
  { id: 'cohere',    name: 'Cohere',          placeholder: 'Paste API key' },
  { id: 'mistral',   name: 'Mistral',         placeholder: 'Paste API key' },
  { id: 'groq',      name: 'Groq',            placeholder: 'gsk_...' },
  { id: 'together',  name: 'Together AI',     placeholder: 'Paste API key' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPassphraseSet: (p: string) => void;
}

export const KeyManagerModal: React.FC<Props> = ({ isOpen, onClose, onPassphraseSet }) => {
  const [passphrase, setPassphrase] = useState('');
  const [inputPassphrase, setInputPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [keysStatus, setKeysStatus] = useState<Record<string, boolean>>({});
  const [newKeyValues, setNewKeyValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const passphraseInputRef = useRef<HTMLInputElement>(null);

  const checkKeys = useCallback(async () => {
    const status: Record<string, boolean> = {};
    for (const p of PROVIDERS) {
      status[p.id] = await hasKeyStored(p.id);
    }
    setKeysStatus(status);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void checkKeys();
      setTimeout(() => passphraseInputRef.current?.focus(), 50);
    }
  }, [isOpen, checkKeys]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSetPassphrase = () => {
    if (inputPassphrase.length < 4) return;
    setPassphrase(inputPassphrase);
    onPassphraseSet(inputPassphrase);
  };

  const handleSaveKey = async (providerId: ProviderId) => {
    const val = newKeyValues[providerId];
    if (!val || !passphrase) return;
    setLoading(true);
    try {
      await saveKey(providerId, val, passphrase);
      setNewKeyValues(prev => ({ ...prev, [providerId]: '' }));
      await checkKeys();
    } catch {
      // swallow; parent error handling
    }
    setLoading(false);
  };

  const handleDeleteKey = async (providerId: ProviderId) => {
    await deleteKey(providerId);
    await checkKeys();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-shell" role="dialog" aria-modal="true" aria-label="API Key Management">
        <div className="modal-header">
          <div className="section-title" style={{ marginBottom: 0 }}>
            <div className="section-title__icon"><KeyRound size={18} /></div>
            <div>
              <h2>API Vault</h2>
              <p>Keys are encrypted with AES-256-GCM and stored locally.</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} type="button" title="Close">
            <X size={18} />
          </button>
        </div>

        {!passphrase ? (
          <div className="vault-intro">
            <p>
              Set a session passphrase to unlock the vault. Keys are derived with PBKDF2 (100k iterations)
              and never leave your device in plaintext.
            </p>
            <div className="vault-row" style={{ position: 'relative' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={passphraseInputRef}
                  type={showPassphrase ? 'text' : 'password'}
                  placeholder="Session passphrase (min 4 chars)"
                  value={inputPassphrase}
                  onChange={e => setInputPassphrase(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSetPassphrase(); }}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(p => !p)}
                  style={{
                    position: 'absolute', right: '.6rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--text-3)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassphrase ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button
                className="btn btn--primary"
                onClick={handleSetPassphrase}
                disabled={inputPassphrase.length < 4}
              >
                Unlock
              </button>
            </div>
          </div>
        ) : (
          <div className="vault-list">
            <div className="vault-status">
              <Check size={16} /> Vault unlocked · AES-256-GCM encryption active
            </div>
            {PROVIDERS.map(provider => (
              <div key={provider.id} className="vault-provider">
                <div className="vault-provider__meta">
                  <h4>{provider.name}</h4>
                  {keysStatus[provider.id]
                    ? <span className="key-status key-status--saved"><Check size={13} /> Key Saved</span>
                    : <span className="key-status">Not configured</span>
                  }
                </div>
                <div className="vault-row">
                  <input
                    type="password"
                    placeholder={keysStatus[provider.id] ? 'Enter new key to overwrite…' : provider.placeholder}
                    value={newKeyValues[provider.id] ?? ''}
                    onChange={e => setNewKeyValues(p => ({ ...p, [provider.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') void handleSaveKey(provider.id); }}
                  />
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => void handleSaveKey(provider.id)}
                    disabled={!newKeyValues[provider.id] || loading}
                    style={{ flexShrink: 0 }}
                  >
                    Save
                  </button>
                  {keysStatus[provider.id] && (
                    <button
                      className="icon-btn icon-btn--danger"
                      onClick={() => void handleDeleteKey(provider.id)}
                      title="Delete key"
                      type="button"
                      style={{ flexShrink: 0 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
