import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import { streamText } from 'ai';
import { getModel, ProviderKeys } from './providers/registry';
import { buildMessages } from './context/builder';
import { evaluateResponse } from './evaluation/engine';
import type { ProviderId, ContextConfig } from '@shared/types';

dotenv.config();

const app = express();
const logger = pino({ transport: { target: 'pino-pretty' } });

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

interface GenerateRequest {
  providerId: ProviderId;
  prompt: string;
  contextConfig: ContextConfig;
  keys?: ProviderKeys;
}

app.post('/api/generate', async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Generation timed out after 90s.' });
  }, 90_000);

  try {
    const { providerId, prompt, contextConfig, keys } = req.body as GenerateRequest;

    if (!providerId || !prompt || !contextConfig) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info({ providerId }, 'Generate request');

    const model = getModel(providerId, keys);
    const messages = buildMessages(prompt, contextConfig);

    const result = await streamText({ model, messages });
    result.pipeTextStreamToResponse(res);
    await result.text; // wait for stream to finish before clearing timeout
    clearTimeout(timeout);
  } catch (error: unknown) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : 'Generation failed';
    logger.error(error, 'Generate error');
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const { providerId, prompt, responseText, contextConfig, keys } = req.body;

    if (!providerId || !prompt || !responseText || !contextConfig) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = getModel(providerId, keys);
    const systemMessages = buildMessages(prompt, contextConfig)
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');

    logger.info({ providerId }, 'Evaluate request');
    const evaluation = await evaluateResponse(model, prompt, responseText, systemMessages);
    res.json(evaluation);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Evaluation failed';
    logger.error(error, 'Evaluate error');
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
