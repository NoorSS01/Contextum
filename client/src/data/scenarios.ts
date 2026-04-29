import { ScenarioPreset } from '@shared/types';
import { DEFAULT_LAYERS } from '../hooks/useContextEngine';

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'angry-customer',
    name: 'Angry Customer',
    description: 'De-escalate an upset user regarding billing.',
    prompt: 'I was double charged this month! The service is awful and I want a refund RIGHT NOW. If you do not fix this I am leaving a 1-star review everywhere!',
    contextConfig: {
      layers: DEFAULT_LAYERS.map(l => {
        if (l.id === 'persona') return { ...l, enabled: true, content: 'You are a compassionate, empathetic customer support agent. You must remain calm and apologize profusely while maintaining professional boundaries.' };
        if (l.id === 'rag') return { ...l, enabled: true, content: 'KB: Refund Policy. Double charges are a known glitch occurring between 1st-5th of the month. Always offer an immediate refund and a 10% discount on the next month.' };
        if (l.id === 'guardrails') return { ...l, enabled: true, content: 'Do NOT promise arbitrary discounts beyond what is in the KB. Do NOT admit legal fault.' };
        return l;
      })
    }
  },
  {
    id: 'tech-debugger',
    name: 'Technical Debugger',
    description: 'Diagnose a complex React performance issue.',
    prompt: 'My React component is re-rendering infinitely when I call setState inside useEffect. How do I fix it?',
    contextConfig: {
      layers: DEFAULT_LAYERS.map(l => {
        if (l.id === 'persona') return { ...l, enabled: true, content: 'You are a senior frontend engineer reviewing junior code. Explain concepts clearly with code examples.' };
        if (l.id === 'enhancer') return { ...l, enabled: true, content: 'Format output with: 1. Root Cause Analysis. 2. Code Snippet. 3. Preventative Best Practices.' };
        return { ...l, enabled: l.id === 'base' };
      })
    }
  },
  {
    id: 'sales-pitch',
    name: 'Sales Conversation',
    description: 'Drafting an outbound sales email for a SaaS product.',
    prompt: 'Write an email to a CTO trying to sell them our Context Engineering platform. Keep it short.',
    contextConfig: {
      layers: DEFAULT_LAYERS.map(l => {
        if (l.id === 'persona') return { ...l, enabled: true, content: 'You are an elite B2B tech sales executive. You write concise, punchy emails that focus on ROI.' };
        if (l.id === 'rag') return { ...l, enabled: true, content: 'Product Info: Context Engineering Platform. Saves 40% on token costs by optimizing what is sent to the LLM. Integrates with Vercel and AWS in 5 minutes.' };
        return { ...l, enabled: l.id === 'base' };
      })
    }
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    description: 'System design interview mock.',
    prompt: 'Design a URL shortening service like Bitly.',
    contextConfig: {
      layers: DEFAULT_LAYERS.map(l => {
        if (l.id === 'persona') return { ...l, enabled: true, content: 'You are an L6 Software Engineer at Google conducting a system design interview.' };
        if (l.id === 'enhancer') return { ...l, enabled: true, content: 'Do NOT give the full answer. Instead, ask probing questions about: Scale, Availability, and Database schema before providing guidance.' };
        return { ...l, enabled: l.id === 'base' };
      })
    }
  }
];
