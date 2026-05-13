/**
 * Rough token count estimator. 
 * Uses the widely accepted ~1.3 tokens-per-word heuristic.
 */
export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.round(words * 1.3);
};

/** Cost in USD per 1M tokens (input). Values approximate as of 2025. */
const COST_PER_1M_INPUT: Record<string, number> = {
  openai: 2.5,      // GPT-4o
  google: 0.35,     // Gemini 1.5 Flash
  anthropic: 3.0,   // Claude 3.5 Sonnet
  cohere: 1.0,      // Command R+
  mistral: 2.0,     // Mistral Large
  groq: 0.59,       // Llama 3 70B via Groq
  together: 0.9,    // Llama 3 70B via Together
};

/** Cost in USD per 1M tokens (output). */
const COST_PER_1M_OUTPUT: Record<string, number> = {
  openai: 10.0,
  google: 1.05,
  anthropic: 15.0,
  cohere: 2.0,
  mistral: 6.0,
  groq: 0.79,
  together: 0.9,
};

export const estimateCostUSD = (
  providerId: string,
  inputTokens: number,
  outputTokens: number
): number => {
  const inRate = COST_PER_1M_INPUT[providerId] ?? 2.0;
  const outRate = COST_PER_1M_OUTPUT[providerId] ?? 5.0;
  return (inRate * inputTokens + outRate * outputTokens) / 1_000_000;
};

export const formatCost = (usd: number): string => {
  if (usd < 0.000001) return '< $0.000001';
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
};
