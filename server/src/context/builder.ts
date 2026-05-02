// Importing libraries
import { ContextConfig } from '@shared/types';
import { CoreMessage } from 'ai';

export const buildMessages = (userPrompt: string, config: ContextConfig): CoreMessage[] => {
  const messages: CoreMessage[] = [];
  let systemText = '';

  const getLayerContent = (id: string) => {
    const layer = config.layers.find(l => l.id === id && l.enabled);
    return layer?.content?.trim();
  };

  // 1. System Instructions / Persona
  const persona = getLayerContent('persona');
  if (persona) systemText += `${persona}\n\n`;

  // 1b. Base Layer (required context rules if any, often combined with Persona)
  const base = getLayerContent('base');
  if (base) systemText += `=== BASE INSTRUCTIONS ===\n${base}\n\n`;

  // 2. Enhanced Prompt rules (Prompt Enhancer layer might provide instructions on how to interpret)
  const enhancer = getLayerContent('enhancer');
  if (enhancer) systemText += `=== PROMPT ENHANCEMENT RULES ===\n${enhancer}\n\n`;

  // 3. RAG Context
  const rag = getLayerContent('rag');
  if (rag) systemText += `=== KNOWLEDGE BASE (RAG) ===\n${rag}\n\n`;

  // 6. Safety Reinforcement
  const guardrails = getLayerContent('guardrails');
  if (guardrails) systemText += `=== SAFETY GUARDRAILS ===\n${guardrails}\n\n`;

  if (systemText.trim()) {
    messages.push({ role: 'system', content: systemText.trim() });
  }

  // 4. Conversation History (we inject history messages before the user prompt)
  const historyStr = getLayerContent('history');
  if (historyStr) {
    // simplistic representation of history, assume it's alternating User/Assistant delimited by newline 
    // For robust implementation, history should be structured, but since content is string, 
    // we prefix it into the context or parse it. Let's just pass it as a user message context block for simplicity
    messages.push({ role: 'user', content: `=== CONVERSATION HISTORY ===\n${historyStr}` });
    messages.push({ role: 'assistant', content: `Understood, please provide your next prompt.` });
  }

  // 5. User Prompt
  messages.push({ role: 'user', content: userPrompt });

  return messages;
};


// this is context builder file.