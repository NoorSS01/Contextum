export type ProviderId = 'openai' | 'google' | 'anthropic' | 'cohere' | 'mistral' | 'groq' | 'together';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  hasKey: boolean; // Computed by client
}

export type LayerType = 'base' | 'enhancer' | 'rag' | 'history' | 'persona' | 'guardrails';

export interface ContextLayer {
  id: LayerType;
  name: string;
  enabled: boolean;
  content: string;
  order: number;
}

export interface ContextConfig {
  layers: ContextLayer[];
}

export interface PromptRequest {
  providerId: ProviderId;
  prompt: string;
  contextConfig: ContextConfig;
}

export interface EvaluationMetrics {
  relevance: number;
  coherence: number;
  completeness: number;
  hallucinationRisk: number;
  instructionAdherence: number;
  overall: number;
}

export interface ResponseResult {
  id: string; // UUID for the response
  providerId: ProviderId;
  prompt: string;
  contextConfig: ContextConfig;
  responseText: string;
  responseTimeMs: number;
  tokenCount: number;
  estimatedCostCent: number;
  evaluation?: EvaluationMetrics;
  timestamp: string; // ISO String
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  contextConfig: ContextConfig;
}
