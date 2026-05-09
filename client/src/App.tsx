import React, { useState, useRef } from 'react';
import { KeyManagerModal } from './components/KeyManagerModal';
import { ContextPanel } from './components/ContextPanel';
import { ProviderSelector } from './components/ProviderSelector';
import { EvaluationScore } from './components/EvaluationScore';
import { ComparisonTable } from './components/ComparisonTable';
import { useContextEngine } from './hooks/useContextEngine';
import { loadKey } from './services/keys';
import { ProviderId, EvaluationMetrics, ResponseResult, ScenarioPreset } from '@shared/types';
import { SCENARIOS } from './data/scenarios';
import { KeyRound, Layers, FlaskConical, Play, StopCircle, BookOpen, Activity, ShieldCheck, Sparkles } from 'lucide-react';

const API_BASE_URL = '/api';

const parseDataStreamLine = (line: string): string => {
  if (!line.startsWith('0:')) return '';

  try {
    const parsed = JSON.parse(line.slice(2));
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return '';
  }
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error || text;
  } catch {
    return text;
  }
};

function App() {
  const [isKeyModalOpen, setKeyModalOpen] = useState(false);
  const [passphrase, setPassphrase] = useState<string>('');
  
  const { layers, toggleLayer, updateLayerContent, getConfig, setLayers } = useContextEngine();
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [prompt, setPrompt] = useState<string>('');
  
  const [output, setOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [experiments, setExperiments] = useState<ResponseResult[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadScenario = (scenario: ScenarioPreset) => {
    setPrompt(scenario.prompt);
    setLayers(scenario.contextConfig.layers);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt.");
      return;
    }

    const key = passphrase ? await loadKey(providerId, passphrase) : null;

    setOutput('');
    setMetrics(null);
    setIsGenerating(true);
    
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();
    const contextConfig = getConfig();
    let fullText = '';
    let streamBuffer = '';

    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          prompt,
          contextConfig,
          keys: key ? { [providerId]: key } : {}
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        if (message.toLowerCase().includes('key required')) {
          setKeyModalOpen(true);
          throw new Error(
            `${message}. Add a key in the Vault, or set a matching API key in the server .env file.`
          );
        }

        throw new Error(message);
      }

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const isTextStream = response.headers.get('content-type')?.includes('text/plain');
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (isTextStream) {
          fullText += chunk;
          setOutput(fullText);
          continue;
        }
        
        streamBuffer += chunk;
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() || '';
        
        for (const line of lines) {
          const textChunk = parseDataStreamLine(line);
          if (!textChunk) continue;

          fullText += textChunk;
          setOutput(fullText);
        }
      }

      const finalChunk = parseDataStreamLine(streamBuffer.trim());
      if (finalChunk) {
        fullText += finalChunk;
        setOutput(fullText);
      }

      if (!fullText.trim()) {
        throw new Error(
          'The provider returned an empty response. Check that the selected model is available for your API key and try again.'
        );
      }

      setIsGenerating(false);
      setIsEvaluating(true);
      const responseTimeMs = Date.now() - startTime;
      
      const evalRes = await fetch(`${API_BASE_URL}/evaluate`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           providerId,
           prompt,
           responseText: fullText,
           contextConfig,
           keys: key ? { [providerId]: key } : {}
         })
      });
      
      let finalMetrics = null;
      if (evalRes.ok) {
        finalMetrics = await evalRes.json();
        setMetrics(finalMetrics);
      }

      // Add to experiments log
      setExperiments(prev => [{
        id: Math.random().toString(36).substring(7),
        providerId,
        prompt,
        contextConfig,
        responseText: fullText,
        responseTimeMs,
        tokenCount: 0, // Mocked for now
        estimatedCostCent: 0, // Mocked for now
        evaluation: finalMetrics,
        timestamp: new Date().toISOString()
      }, ...prev]);
      
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      if (error instanceof Error) {
        console.error(error);
        alert(`Generation failed: ${error.message}`);
      } else {
        console.error(error);
        alert('Generation failed: Unknown error');
      }
    } finally {
      setIsGenerating(false);
      setIsEvaluating(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="brand-mark">
            <FlaskConical size={22} />
          </div>
          <div>
            <h1>Contextum</h1>
            <p>Context engineering lab</p>
          </div>
        </div>

        <div className="topbar__actions">
            <ProviderSelector selectedId={providerId} onSelect={setProviderId} />
          <button className={passphrase ? 'button button--success' : 'button button--secondary'} onClick={() => setKeyModalOpen(true)}>
              <KeyRound size={18} />
            Vault {passphrase ? 'Unlocked' : 'Locked'}
            </button>
          </div>
      </header>

      <main className="app-main">
        <section className="hero-band">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> Experiment Workbench</p>
            <h2>Build, test, and score context layers with a cleaner signal path.</h2>
          </div>
          <div className="status-strip">
            <div className="status-pill">
              <Activity size={16} />
              <span>{experiments.length} runs</span>
              </div>
            <div className="status-pill">
              <ShieldCheck size={16} />
              <span>{layers.filter(layer => layer.enabled).length} active layers</span>
            </div>
          </div>
        </section>

        <section className="preset-bar">
          <div className="section-title section-title--compact">
            <BookOpen size={18} />
            <div>
              <h2>Scenario Preset</h2>
              <p>Load a ready-made context stack, then edit the layers below.</p>
            </div>
          </div>
          <select
            className="preset-select"
            onChange={e => {
                const s = SCENARIOS.find(x => x.id === e.target.value);
                if (s) loadScenario(s);
            }}
            defaultValue=""
          >
                <option value="" disabled>Select preset</option>
                {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
        </section>

        <section className="workspace-grid">
          <div className="workspace-column">
            <section className="panel">
              <div className="section-title">
                <Layers size={20} />
                <div>
                  <h2>Context Layers</h2>
                  <p>Control exactly what gets sent to the model.</p>
                </div>
              </div>

              <ContextPanel 
                layers={layers} 
                onToggle={toggleLayer} 
                onUpdateContent={updateLayerContent} 
              />
            </section>

            <section className="panel prompt-panel">
              <div className="section-title">
                <Sparkles size={20} />
                <div>
                  <h2>User Prompt</h2>
                  <p>The live prompt tested against the selected context stack.</p>
                </div>
              </div>
              <textarea 
                placeholder="Enter your prompt here..." 
                rows={5} 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="prompt-input"
              />
              <div className="prompt-actions">
                {!isGenerating ? (
                  <button className="button button--primary" onClick={handleGenerate}>
                    <Play size={18} /> Generate Response
                  </button>
                ) : (
                  <button className="button button--danger" onClick={handleStop}>
                    <StopCircle size={18} /> Stop Generation
                  </button>
                )}
              </div>
            </section>
          </div>

          <div className="workspace-column workspace-column--sticky">
            <section className="panel output-panel">
              <div className="section-title">
                <Activity size={20} />
                <div>
                  <h2>Engine Output</h2>
                  <p>Streaming model response from the active provider.</p>
                </div>
              </div>
              <div className="output-box">
                {output ? output : <span>Awaiting generation...</span>}
              </div>
            </section>

            <section className="panel">
              <div className="section-title">
                <ShieldCheck size={20} />
                <div>
                  <h2>Evaluation Engine</h2>
                  <p>Strict judge scores context adherence and response quality.</p>
                </div>
              </div>
              {(isEvaluating || metrics) ? (
                <EvaluationScore metrics={metrics} loading={isEvaluating} />
              ) : (
                <div className="empty-state">
                  Run a generation to evaluate context quality.
                </div>
              )}
            </section>
          </div>
        </section>

        <ComparisonTable experiments={experiments} />
      </main>

      <KeyManagerModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setKeyModalOpen(false)} 
        onPassphraseSet={setPassphrase}
      />
    </div>
  );
}

export default App;
