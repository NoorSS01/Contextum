import React, { useState, useEffect } from 'react';
import { ProviderId } from '@shared/types';
import { saveKey, hasKeyStored, deleteKey } from '../services/keys';
import { KeyRound, Check, X, Trash2 } from 'lucide-react';

const PROVIDERS: { id: ProviderId; name: string }[] = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'google', name: 'Google Gemini' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'cohere', name: 'Cohere' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'groq', name: 'Groq' },
  { id: 'together', name: 'Together AI' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPassphraseSet: (passphrase: string) => void;
}

export const KeyManagerModal: React.FC<Props> = ({ isOpen, onClose, onPassphraseSet }) => {
  const [passphrase, setPassphrase] = useState('');
  const [inputPassphrase, setInputPassphrase] = useState('');
  const [keysStatus, setKeysStatus] = useState<Record<string, boolean>>({});
  const [newKeyValues, setNewKeyValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkKeys();
    }
  }, [isOpen]);

  const checkKeys = async () => {
    const status: Record<string, boolean> = {};
    for (const p of PROVIDERS) {
      status[p.id] = await hasKeyStored(p.id);
    }
    setKeysStatus(status);
  };

  const handleSetPassphrase = () => {
    if (inputPassphrase.length < 4) {
      alert("Passphrase too short.");
      return;
    }
    setPassphrase(inputPassphrase);
    onPassphraseSet(inputPassphrase);
  };

  const handleSaveKey = async (providerId: ProviderId) => {
    const keyVal = newKeyValues[providerId];
    if (!keyVal || !passphrase) return;
    
    setLoading(true);
    try {
      await saveKey(providerId, keyVal, passphrase);
      setNewKeyValues({ ...newKeyValues, [providerId]: '' });
      await checkKeys();
    } catch (err) {
      console.error(err);
      alert('Failed to save key.');
    }
    setLoading(false);
  };

  const handleDeleteKey = async (providerId: ProviderId) => {
    if(!confirm("Are you sure you want to delete this key?")) return;
    await deleteKey(providerId);
    await checkKeys();
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel p-6" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <KeyRound className="text-accent-primary" />
            <h2>API Key Management</h2>
          </div>
          <button className="secondary" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>
            <X size={20} />
          </button>
        </div>

        {!passphrase ? (
          <div className="glass-panel p-4 mb-4">
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Enter a session passphrase. This encrypts your keys in the browser before storage. 
              You will need this passphrase each time you reload the app.
            </p>
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder="Session Passphrase" 
                value={inputPassphrase}
                onChange={e => setInputPassphrase(e.target.value)}
              />
              <button className="primary" onClick={handleSetPassphrase}>Unlock</button>
            </div>
          </div>
        ) : (
          <div className="flex-col gap-4">
            <div className="glass-panel p-4 mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <p style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} /> Vault unlocked. Keys are encrypted with AES-256-GCM.
              </p>
            </div>

            {PROVIDERS.map(provider => (
              <div key={provider.id} className="flex-col gap-2 p-4 mb-2 glass-panel" style={{ background: 'transparent' }}>
                <div className="flex justify-between items-center">
                  <h4 style={{ margin: 0 }}>{provider.name}</h4>
                  {keysStatus[provider.id] ? (
                    <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Key Saved
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Not configured</span>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2">
                  <input 
                    type="password" 
                    placeholder={keysStatus[provider.id] ? "Enter new key to overwrite..." : "sk-..."}
                    value={newKeyValues[provider.id] || ''}
                    onChange={e => setNewKeyValues({...newKeyValues, [provider.id]: e.target.value})}
                  />
                  <button 
                    className="primary" 
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={!newKeyValues[provider.id] || loading}
                  >
                    Save
                  </button>
                  {keysStatus[provider.id] && (
                    <button 
                      className="secondary" 
                      onClick={() => handleDeleteKey(provider.id)}
                      title="Delete Key"
                    >
                      <Trash2 size={18} style={{ color: 'var(--danger)' }} />
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
