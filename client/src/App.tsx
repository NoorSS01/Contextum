import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KeyManagerModal } from './components/KeyManagerModal';
import { ContextPanel } from './components/ContextPanel';
import { ProviderSelector } from './components/ProviderSelector';
import { EvaluationScore } from './components/EvaluationScore';
import { ComparisonTable } from './components/ComparisonTable';
import { ScenarioCards } from './components/ScenarioCards';
import { AssembledContextDrawer } from './components/AssembledContextDrawer';
import { DEFAULT_LAYERS, useContextEngine } from './hooks/useContextEngine';
import { useGeneration } from './hooks/useGeneration';
import { useToast } from './components/Toast';
import { SCENARIOS } from './data/scenarios';
import { buildContextMessages } from './utils/contextPreview';
import { formatCost } from './utils/tokenEstimate';
import {
  FlaskConical, KeyRound, Layers, Sparkles, Activity,
  ShieldCheck, Play, StopCircle, Copy, Eye, Clock, Coins, Hash,
  BookOpen, Loader2, RotateCcw,
} from 'lucide-react';
import type { ContextLayer, ProviderId, ScenarioPreset } from '@shared/types';

const MAX_PROMPT_CHARS = 4000;
const WORKSPACE_DRAFT_KEY = 'contextum:workspace-draft';
const PROVIDER_IDS: ProviderId[] = ['openai', 'google', 'anthropic', 'cohere', 'mistral', 'groq', 'together'];

interface WorkspaceDraft {
  prompt: string;
  providerId: ProviderId;
  activeScenarioId: string | null;
  layers: ContextLayer[];
}

const isWorkspaceDraft = (value: unknown): value is WorkspaceDraft => {
  if (!value || typeof value !== 'object') return false;

  const draft = value as Partial<WorkspaceDraft>;
  return (
    typeof draft.prompt === 'string' &&
    typeof draft.providerId === 'string' &&
    PROVIDER_IDS.includes(draft.providerId as ProviderId) &&
    (draft.activeScenarioId === null || typeof draft.activeScenarioId === 'string') &&
    Array.isArray(draft.layers)
  );
};

const loadWorkspaceDraft = (): WorkspaceDraft | null => {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    return isWorkspaceDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

function App() {
  const { toast } = useToast();
  const [initialDraft] = useState<WorkspaceDraft | null>(() => loadWorkspaceDraft());
  const [isKeyModalOpen, setKeyModalOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(
    initialDraft?.activeScenarioId ?? null
  );
  const [isContextDrawerOpen, setContextDrawerOpen] = useState(false);

  const { layers, toggleLayer, updateLayerContent, getConfig, setLayers } = useContextEngine(
    initialDraft?.layers
  );
  const [providerId, setProviderId] = useState<ProviderId>(
    initialDraft?.providerId ?? 'openai'
  );
  const [prompt, setPrompt] = useState(initialDraft?.prompt ?? '');

  const {
    output, isGenerating, isEvaluating, metrics, experiments,
    lastRunMeta, generate, stop, clearExperiments,
    assembledMessages, currentContextConfig,
  } = useGeneration();

  const outputRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll output to bottom during streaming
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isGenerating]);

  useEffect(() => {
    if (initialDraft) {
      toast('info', 'Restored your previous workspace.');
    }
  }, [initialDraft, toast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const isDefaultWorkspace =
        !prompt &&
        !activeScenarioId &&
        providerId === 'openai' &&
        JSON.stringify(layers) === JSON.stringify(DEFAULT_LAYERS);

      const draft: WorkspaceDraft = {
        prompt,
        providerId,
        activeScenarioId,
        layers,
      };

      try {
        if (isDefaultWorkspace) {
          window.localStorage.removeItem(WORKSPACE_DRAFT_KEY);
          return;
        }

        window.localStorage.setItem(WORKSPACE_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignore storage failures.
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeScenarioId, layers, prompt, providerId]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    const result = await generate({
      providerId,
      prompt,
      contextConfig: getConfig(),
      passphrase,
      onVaultNeeded: () => setKeyModalOpen(true),
      onError: (msg) => toast('error', msg),
    });
    return result;
  }, [generate, providerId, prompt, getConfig, passphrase, isGenerating, toast]);

  // Ctrl+Enter handler attached to prompt textarea
  const handlePromptKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleGenerate();
    }
  }, [handleGenerate]);

  const handleCopyOutput = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output)
      .then(() => toast('success', 'Copied to clipboard.'))
      .catch(() => toast('error', 'Failed to copy.'));
  }, [output, toast]);

  const handleResetWorkspace = useCallback(() => {
    setPrompt('');
    setProviderId('openai');
    setActiveScenarioId(null);
    setLayers(DEFAULT_LAYERS);
    try {
      window.localStorage.removeItem(WORKSPACE_DRAFT_KEY);
    } catch {
      // Ignore storage failures.
    }
    toast('info', 'Workspace reset.');
  }, [setLayers, toast]);

  const loadScenario = useCallback((scenario: ScenarioPreset) => {
    setPrompt(scenario.prompt);
    setLayers(scenario.contextConfig.layers);
    setActiveScenarioId(scenario.id);
    toast('info', `Loaded: ${scenario.name}`);
  }, [setLayers, toast]);

  const previewMessages = isContextDrawerOpen
    ? buildContextMessages(prompt, getConfig())
    : assembledMessages;

  const charOverLimit = prompt.length > MAX_PROMPT_CHARS;
  const activeLayers = layers.filter(l => l.enabled).length;
  const isBusy = isGenerating || isEvaluating;

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar__brand">
          <div className="brand-mark">
            <FlaskConical size={20} />
          </div>
          <div>
            <div className="brand-name">Contextum</div>
            <div className="brand-sub">Context engineering lab</div>
          </div>
        </div>

        <div className="topbar__center">
          {isBusy && (
            <div className="topbar-status">
              <Loader2 size={14} className="spin" />
              <span>{isGenerating ? 'Generating...' : 'Evaluating...'}</span>
            </div>
          )}
        </div>

        <div className="topbar__actions">
          <ProviderSelector selectedId={providerId} onSelect={setProviderId} />
          <div className="topbar-divider" />
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setContextDrawerOpen(true)}
            title="Inspect assembled context"
          >
            <Eye size={15} /> Context
          </button>
          <button
            className={passphrase ? 'btn btn--success btn--sm' : 'btn btn--secondary btn--sm'}
            onClick={() => setKeyModalOpen(true)}
          >
            <KeyRound size={15} />
            {passphrase ? 'Vault saved' : 'Vault'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="app-main">

        {/* Hero */}
        <div className="hero-band">
          <div>
            <p className="eyebrow"><Sparkles size={13} /> Experiment Workbench</p>
            <h2>Design, test, and score context layers with a cleaner signal path.</h2>
          </div>
          <div className="status-strip">
            <div className="status-pill">
              <Activity size={14} />
              <span>{experiments.length} run{experiments.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="status-pill">
              <ShieldCheck size={14} />
              <span>{activeLayers} active layer{activeLayers !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Scenarios */}
        <section className="scenario-section panel">
          <div className="section-label">
            <BookOpen size={15} />
            <span>Scenario Presets</span>
            <span className="section-label__sub">Load a ready-made context stack to explore</span>
          </div>
          <ScenarioCards
            scenarios={SCENARIOS}
            activeScenarioId={activeScenarioId}
            onSelect={loadScenario}
          />
        </section>

        {/* Workspace */}
        <div className="workspace-grid">
          {/* Left col */}
          <div className="workspace-col">
            <section className="panel">
              <div className="section-title">
                <div className="section-title__icon"><Layers size={18} /></div>
                <div>
                  <h2>Context Layers</h2>
                  <p>Toggle and edit what gets sent to the model.</p>
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
                <div className="section-title__icon"><Sparkles size={18} /></div>
                <div>
                  <h2>User Prompt</h2>
                  <p>
                    <kbd className="kbd">Ctrl+Enter</kbd> to generate
                  </p>
                </div>
              </div>
              <textarea
                ref={promptRef}
                className="prompt-input"
                placeholder="Enter your prompt here..."
                rows={5}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handlePromptKeyDown}
                aria-label="User prompt"
              />
              <div className="prompt-meta">
                <span className={`char-count${charOverLimit ? ' char-count--warn' : ''}`}>
                  {prompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()}
                </span>
                <div className="prompt-actions">
                  {(prompt || activeScenarioId) && !isGenerating && (
                    <button className="btn btn--ghost btn--sm" onClick={handleResetWorkspace}>
                      <RotateCcw size={14} /> Reset
                    </button>
                  )}
                  {isGenerating ? (
                    <button className="btn btn--danger btn--sm" onClick={stop}>
                      <StopCircle size={15} /> Stop
                    </button>
                  ) : (
                    <button
                      className="btn btn--primary"
                      onClick={() => void handleGenerate()}
                      disabled={!prompt.trim() || charOverLimit}
                    >
                      <Play size={15} /> Generate
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right col */}
          <div className="workspace-col workspace-col--sticky">
            <section className="panel">
              <div className="section-title" style={{ marginBottom: '.75rem' }}>
                <div className="section-title__icon"><Activity size={18} /></div>
                <div style={{ flex: 1 }}>
                  <h2>Engine Output</h2>
                  <p>Live streaming - {isGenerating ? <span className="streaming-label">streaming</span> : 'idle'}</p>
                </div>
                {output && !isGenerating && (
                  <button
                    className="icon-btn"
                    style={{ width: 30, height: 30, marginLeft: 'auto' }}
                    onClick={handleCopyOutput}
                    title="Copy output"
                  >
                    <Copy size={13} />
                  </button>
                )}
              </div>

              <div
                ref={outputRef}
                className={`output-box${isGenerating ? ' output-box--streaming' : ''}`}
              >
                {output ? (
                  <>
                    <OutputRenderer text={output} />
                    {isGenerating && <span className="cursor-blink" />}
                  </>
                ) : (
                  <div className="output-empty-state">
                    <div className="output-empty-icon">
                      <Activity size={28} />
                    </div>
                    <p>{isGenerating ? 'Waiting for first token...' : 'Awaiting generation...'}</p>
                    {!isGenerating && <p className="output-empty-hint">Configure layers, enter a prompt, press Generate.</p>}
                  </div>
                )}
              </div>

              {lastRunMeta && (
                <div className="output-meta">
                  <span className="meta-chip"><Clock size={12} /><strong>{lastRunMeta.latencyMs.toLocaleString()}ms</strong></span>
                  <span className="meta-chip"><Hash size={12} /><strong>~{(lastRunMeta.promptTokens + lastRunMeta.completionTokens).toLocaleString()}</strong> tokens</span>
                  <span className="meta-chip"><Coins size={12} /><strong>{formatCost(lastRunMeta.costUSD)}</strong></span>
                </div>
              )}
            </section>

            <section className="panel">
              <div className="section-title">
                <div className="section-title__icon"><ShieldCheck size={18} /></div>
                <div>
                  <h2>Evaluation Engine</h2>
                  <p>AI-estimated quality - not ground truth</p>
                </div>
              </div>
              <EvaluationScore metrics={metrics} loading={isEvaluating} />
            </section>
          </div>
        </div>

        {/* Comparison table */}
        <ComparisonTable experiments={experiments} onClear={clearExperiments} />
      </main>

      <KeyManagerModal
        isOpen={isKeyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onPassphraseSet={setPassphrase}
      />
      <AssembledContextDrawer
        isOpen={isContextDrawerOpen}
        onClose={() => setContextDrawerOpen(false)}
        contextConfig={currentContextConfig ?? getConfig()}
        assembledMessages={previewMessages}
      />
    </div>
  );
}

/** Lightweight markdown-lite renderer: handles code blocks, bold, inline code */
function OutputRenderer({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="output-code-block">
          {lang && <span className="output-code-lang">{lang}</span>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
    } else if (line.startsWith('# ')) {
      elements.push(<p key={i} className="output-h1">{line.slice(2)}</p>);
    } else if (line.startsWith('## ')) {
      elements.push(<p key={i} className="output-h2">{line.slice(3)}</p>);
    } else if (line.startsWith('### ')) {
      elements.push(<p key={i} className="output-h3">{line.slice(4)}</p>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<div key={i} className="output-li"><span className="output-li-dot" /><span>{renderInline(line.slice(2))}</span></div>);
    } else if (line === '') {
      elements.push(<div key={i} className="output-spacer" />);
    } else {
      elements.push(<p key={i} className="output-p">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="output-content">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** and `code` inline
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="output-inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default App;
