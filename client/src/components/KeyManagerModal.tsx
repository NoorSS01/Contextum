import React, { useCallback, useState, useEffect } from 'react';
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

  const checkKeys = useCallback(async () => {
    const status: Record<string, boolean> = {};
    for (const p of PROVIDERS) {
      status[p.id] = await hasKeyStored(p.id);
    }
    setKeysStatus(status);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(checkKeys);
    }
  }, [checkKeys, isOpen]);

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
    <div className="modal-backdrop">
      <div className="modal-shell">
        <div className="modal-header">
          <div className="section-title section-title--compact">
            <KeyRound size={20} />
            <h2>API Key Management</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" title="Close">
            <X size={20} />
          </button>
        </div>

        {!passphrase ? (
          <div className="vault-intro">
            <p>
              Enter a session passphrase. This encrypts your keys in the browser before storage. 
              You will need this passphrase each time you reload the app.
            </p>
            <div className="vault-row">
              <input 
                type="password" 
                placeholder="Session Passphrase" 
                value={inputPassphrase}
                onChange={e => setInputPassphrase(e.target.value)}
              />
              <button className="button button--primary" onClick={handleSetPassphrase}>Unlock</button>
            </div>
          </div>
        ) : (
          <div className="vault-list">
            <div className="vault-status">
                <Check size={16} /> Vault unlocked. Keys are encrypted with AES-256-GCM.
            </div>

            {PROVIDERS.map(provider => (
              <div key={provider.id} className="vault-provider">
                <div className="vault-provider__meta">
                  <h4>{provider.name}</h4>
                  {keysStatus[provider.id] ? (
                    <span className="key-status key-status--saved">
                      <Check size={14} /> Key Saved
                    </span>
                  ) : (
                    <span className="key-status">Not configured</span>
                  )}
                </div>
                
                <div className="vault-row">
                  <input 
                    type="password" 
                    placeholder={keysStatus[provider.id] ? "Enter new key to overwrite" : "Paste API key"}
                    value={newKeyValues[provider.id] || ''}
                    onChange={e => setNewKeyValues({...newKeyValues, [provider.id]: e.target.value})}
                  />
                  <button 
                    className="button button--primary" 
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={!newKeyValues[provider.id] || loading}
                  >
                    Save
                  </button>
                  {keysStatus[provider.id] && (
                    <button 
                      className="icon-button icon-button--danger" 
                      onClick={() => handleDeleteKey(provider.id)}
                      title="Delete key"
                      type="button"
                    >
                      <Trash2 size={18} />
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
