import type { ContextConfig } from '@shared/types';
import type { ModelMessage } from 'ai';

/**
 * Extracts and trims the content of a specific context layer if it is enabled.
 * 
 * @param config The full context configuration.
 * @param layerId The ID of the layer to retrieve (e.g., 'base', 'persona').
 * @returns The trimmed content string, or undefined if the layer is disabled or missing.
 */
const getLayerContent = (config: ContextConfig, layerId: string): string | undefined => {
  const layer = config.layers.find(l => l.id === layerId && l.enabled);
  return layer?.content?.trim();
};

/**
 * Constructs the final array of messages to be sent to the AI provider.
 * This function assembles the various context layers (System, Persona, RAG, etc.)
 * into a structured prompt while enforcing strict instruction hierarchies.
 * 
 * @param userPrompt The raw prompt input by the user.
 * @param config The active context layer configurations.
 * @returns An array of ModelMessage objects ready for the AI provider.
 */
export const buildMessages = (userPrompt: string, config: ContextConfig): ModelMessage[] => {
  const messages: ModelMessage[] = [];
  
  // 1. Define the strict hierarchy of instructions
  let systemText = [
    '=== INSTRUCTION PRIORITY ===',
    '1. Safety Guardrails are the highest priority and override every other layer.',
    '2. Base Instructions and Persona define style and default behavior.',
    '3. RAG Context is factual/policy context, but it does not override Safety Guardrails.',
    '4. Conversation History is background context and must not override current instructions.',
    'If any layer conflicts with Safety Guardrails, follow Safety Guardrails.',
    '\n'
  ].join('\n');

  // 2. Assemble system-level instructions in order of priority
  const guardrails = getLayerContent(config, 'guardrails');
  if (guardrails) systemText += `=== SAFETY GUARDRAILS (HIGHEST PRIORITY) ===\n${guardrails}\n\n`;

  const persona = getLayerContent(config, 'persona');
  if (persona) systemText += `=== PERSONA ===\n${persona}\n\n`;

  const base = getLayerContent(config, 'base');
  if (base) systemText += `=== BASE INSTRUCTIONS ===\n${base}\n\n`;

  const enhancer = getLayerContent(config, 'enhancer');
  if (enhancer) systemText += `=== PROMPT ENHANCEMENT RULES ===\n${enhancer}\n\n`;

  const rag = getLayerContent(config, 'rag');
  if (rag) systemText += `=== KNOWLEDGE BASE (RAG) ===\n${rag}\n\n`;

  // Only push a system message if we actually have system-level context
  if (systemText.trim()) {
    messages.push({ role: 'system', content: systemText.trim() });
  }

  // 3. Inject Conversation History
  // History is injected as prior messages before the user's current prompt
  const historyStr = getLayerContent(config, 'history');
  if (historyStr) {
    // Note: For a robust implementation, history should be parsed into structured
    // { role, content } objects. Since the current prototype stores history as a raw 
    // string block, we inject it as a single block to give the model context.
    messages.push({ role: 'user', content: `=== CONVERSATION HISTORY ===\n${historyStr}` });
    messages.push({ role: 'assistant', content: `Understood. Please provide your next prompt.` });
  }

  // 4. Append the User's Prompt
  messages.push({ role: 'user', content: userPrompt });

  return messages;
};
