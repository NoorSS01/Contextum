import { useRef, useState, useCallback } from 'react';
import { ProviderId, ContextConfig, EvaluationMetrics, ResponseResult } from '@shared/types';
import { loadKey } from '../services/keys';
import { buildContextMessages } from '../utils/contextPreview';
import { estimateTokens, estimateCostUSD } from '../utils/tokenEstimate';

const API_BASE = '/api';

const parseDataStreamLine = (line: string): string => {
  if (!line.startsWith('0:')) return '';
  try {
    const parsed = JSON.parse(line.slice(2));
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return '';
  }
};

interface GenerationState {
  output: string;
  isGenerating: boolean;
  isEvaluating: boolean;
  metrics: EvaluationMetrics | null;
  experiments: ResponseResult[];
  lastRunMeta: { promptTokens: number; completionTokens: number; latencyMs: number; costUSD: number } | null;
}

interface UseGenerationResult extends GenerationState {
  generate: (params: {
    providerId: ProviderId;
    prompt: string;
    contextConfig: ContextConfig;
    passphrase: string;
    onVaultNeeded: () => void;
    onError: (msg: string) => void;
  }) => Promise<void>;
  stop: () => void;
  clearExperiments: () => void;
  assembledMessages: { role: string; content: string }[];
  currentContextConfig: ContextConfig | null;
}

export const useGeneration = (): UseGenerationResult => {
  const [state, setState] = useState<GenerationState>({
    output: '',
    isGenerating: false,
    isEvaluating: false,
    metrics: null,
    experiments: [],
    lastRunMeta: null,
  });
  const [assembledMessages, setAssembledMessages] = useState<{ role: string; content: string }[]>([]);
  const [currentContextConfig, setCurrentContextConfig] = useState<ContextConfig | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearExperiments = useCallback(() => {
    setState(prev => ({ ...prev, experiments: [] }));
  }, []);

  const generate = useCallback(async ({
    providerId,
    prompt,
    contextConfig,
    passphrase,
    onVaultNeeded,
    onError,
  }: {
    providerId: ProviderId;
    prompt: string;
    contextConfig: ContextConfig;
    passphrase: string;
    onVaultNeeded: () => void;
    onError: (msg: string) => void;
  }) => {
    if (!prompt.trim()) {
      onError('Please enter a prompt.');
      return;
    }

    const key = passphrase ? await loadKey(providerId, passphrase) : null;

    // Update the drawer preview even before generation
    const preview = buildContextMessages(prompt, contextConfig);
    setAssembledMessages(preview);
    setCurrentContextConfig(contextConfig);

    setState(prev => ({
      ...prev,
      output: '',
      metrics: null,
      isGenerating: true,
      lastRunMeta: null,
    }));

    abortRef.current = new AbortController();
    const startTime = Date.now();
    let fullText = '';
    let streamBuffer = '';

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          prompt,
          contextConfig,
          keys: key ? { [providerId]: key } : {},
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        let msg: string;
        try { msg = (JSON.parse(text) as { error?: string }).error ?? text; } catch { msg = text; }
        if (msg.toLowerCase().includes('key required')) { onVaultNeeded(); }
        throw new Error(msg);
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
          setState(prev => ({ ...prev, output: fullText }));
          continue;
        }

        streamBuffer += chunk;
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop() ?? '';
        let hasUpdates = false;
        for (const line of lines) {
          const text = parseDataStreamLine(line);
          if (!text) continue;
          fullText += text;
          hasUpdates = true;
        }
        if (hasUpdates) {
          setState(prev => ({ ...prev, output: fullText }));
        }
      }

      // flush remaining buffer
      const finalChunk = parseDataStreamLine(streamBuffer.trim());
      if (finalChunk) {
        fullText += finalChunk;
        setState(prev => ({ ...prev, output: fullText }));
      }

      if (!fullText.trim()) {
        throw new Error('The provider returned an empty response. Check your API key and selected model.');
      }

      const latencyMs = Date.now() - startTime;
      const promptTokens = estimateTokens(prompt);
      const completionTokens = estimateTokens(fullText);
      const costUSD = estimateCostUSD(providerId, promptTokens, completionTokens);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        isEvaluating: true,
        lastRunMeta: { promptTokens, completionTokens, latencyMs, costUSD },
      }));

      // Evaluate
      let finalMetrics: EvaluationMetrics | null = null;
      try {
        const evalRes = await fetch(`${API_BASE}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId,
            prompt,
            responseText: fullText,
            contextConfig,
            keys: key ? { [providerId]: key } : {},
          }),
        });
        if (evalRes.ok) finalMetrics = await evalRes.json();
      } catch {
        // evaluation failing doesn't kill the run
      }

      setState(prev => ({
        ...prev,
        isEvaluating: false,
        metrics: finalMetrics,
        experiments: [
          {
            id: Math.random().toString(36).slice(2),
            providerId,
            prompt,
            contextConfig,
            responseText: fullText,
            responseTimeMs: latencyMs,
            tokenCount: promptTokens + completionTokens,
            estimatedCostCent: Math.round(costUSD * 100 * 100) / 100,
            evaluation: finalMetrics ?? undefined,
            timestamp: new Date().toISOString(),
          },
          ...prev.experiments,
        ],
      }));
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      onError(msg);
    } finally {
      setState(prev => ({ ...prev, isGenerating: false, isEvaluating: false }));
    }
  }, []);

  return {
    ...state,
    generate,
    stop,
    clearExperiments,
    assembledMessages,
    currentContextConfig,
  };
};
