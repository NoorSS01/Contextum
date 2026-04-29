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
import { KeyRound, Layers, FlaskConical, Play, StopCircle, BookOpen } from 'lucide-react';

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
    if (!passphrase) {
      alert("Please set a vault passphrase and configure an API key first.");
      setKeyModalOpen(true);
      return;
    }
    if (!prompt.trim()) {
      alert("Please enter a prompt.");
      return;
    }

    const key = await loadKey(providerId, passphrase);
    if (!key) {
      alert(`No valid API key found for ${providerId}. Please update your vault.`);
      setKeyModalOpen(true);
      return;
    }

    setOutput('');
    setMetrics(null);
    setIsGenerating(true);
    
    abortControllerRef.current = new AbortController();

    const startTime = Date.now();
    let fullText = '';

    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          prompt,
          contextConfig: getConfig(),
          keys: { [providerId]: key }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const textChunk = JSON.parse(line.slice(2));
              if (typeof textChunk === 'string') {
                fullText += textChunk;
                setOutput(fullText);
              }
            } catch (e) {}
          } else if (line && !line.match(/^[0-9]:/)) {
            fullText += line;
            setOutput(fullText);
          }
        }
      }

      setIsGenerating(false);
      setIsEvaluating(true);
      const responseTimeMs = Date.now() - startTime;
      
      const evalRes = await fetch('http://localhost:3001/api/evaluate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           providerId,
           prompt,
           responseText: fullText,
           contextConfig: getConfig(),
           keys: { [providerId]: key }
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
        contextConfig: getConfig(),
        responseText: fullText,
        responseTimeMs,
        tokenCount: 0, // Mocked for now
        estimatedCostCent: 0, // Mocked for now
        evaluation: finalMetrics,
        timestamp: new Date().toISOString()
      }, ...prev]);
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(error);
        alert(`Generation failed: ${error.message}`);
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
    <>
      <header style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '1rem 2rem' }}>
        <div className="container" style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2">
            <FlaskConical className="text-accent-primary" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Context Engineering</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ProviderSelector selectedId={providerId} onSelect={setProviderId} />
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
            <button className="secondary" onClick={() => setKeyModalOpen(true)}>
              <KeyRound size={18} />
              Vault {passphrase ? '(Unlocked)' : '(Locked)'}
            </button>
          </div>
        </div>
      </header>

      <main className="container flex-col mt-4 gap-6">
        <div className="flex gap-6 w-full">
          {/* Left Column: Context & Input */}
          <div className="flex-col gap-4" style={{ flex: 1, minWidth: 0 }}>
            
            <div className="glass-panel p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="text-accent-primary" size={18} />
                <span style={{ fontWeight: 500 }}>Load Scenario Preset:</span>
              </div>
              <select onChange={e => {
                const s = SCENARIOS.find(x => x.id === e.target.value);
                if (s) loadScenario(s);
              }} defaultValue="" style={{ width: '200px' }}>
                <option value="" disabled>Select Preset...</option>
                {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="text-accent-primary" />
                <h2 style={{ margin: 0 }}>Context Layers</h2>
              </div>
              <ContextPanel 
                layers={layers} 
                onToggle={toggleLayer} 
                onUpdateContent={updateLayerContent} 
              />
            </div>

            <div className="glass-panel p-6">
              <h2 style={{ margin: 0, marginBottom: '1rem' }}>User Prompt</h2>
              <textarea 
                placeholder="Enter your prompt here..." 
                rows={4} 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ resize: 'vertical' }}
              />
              <div className="flex justify-end mt-4">
                {!isGenerating ? (
                  <button className="primary" onClick={handleGenerate}>
                    <Play size={18} /> Generate Response
                  </button>
                ) : (
                  <button className="secondary" onClick={handleStop} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <StopCircle size={18} /> Stop Generation
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output & Evaluation */}
          <div className="flex-col gap-4" style={{ flex: 1, minWidth: 0 }}>
            <div className="glass-panel p-6" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, marginBottom: '1rem' }}>Engine Output</h2>
              <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowY: 'auto', maxHeight: '400px' }}>
                {output ? output : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Awaiting generation...</span>}
              </div>
            </div>

            <div className="glass-panel p-6">
              <h2 style={{ margin: 0, marginBottom: '1rem' }}>Evaluation Engine</h2>
              {(isEvaluating || metrics) ? (
                <EvaluationScore metrics={metrics} loading={isEvaluating} />
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Run a generation to evaluate context quality.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Experiments Comparison */}
        <ComparisonTable experiments={experiments} />
      </main>

      <KeyManagerModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setKeyModalOpen(false)} 
        onPassphraseSet={setPassphrase}
      />
    </>
  );
}

export default App;
