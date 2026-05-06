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

// Need to allow CORS and parsing JSON
app.use(cors());
app.use(express.json());

interface GenerateRequest {
  providerId: ProviderId;
  prompt: string;
  contextConfig: ContextConfig;
  keys: ProviderKeys;
}

app.post('/api/generate', async (req, res) => {
  try {
    const { providerId, prompt, contextConfig, keys } = req.body as GenerateRequest;

    if (!providerId || !prompt || !contextConfig || !keys) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info({ providerId, hasContent: !!contextConfig }, 'Received generation request');

    const model = getModel(providerId, keys);
    const messages = buildMessages(prompt, contextConfig);

    const result = await streamText({
      model,
      messages,
      // Calculate token info roughly manually or rely on the metadata if available
    });

    result.pipeTextStreamToResponse(res);
  } catch (error: any) {
    logger.error(error, 'Generate API error');
    res.status(500).json({ error: error?.message || 'Generation failed' });
  }
});

app.post('/api/evaluate', async (req, res) => {
  try {
    const { providerId, prompt, responseText, contextConfig, keys } = req.body;

    if (!providerId || !prompt || !responseText || !contextConfig || !keys) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Evaluate using the active provider
    const model = getModel(providerId, keys);
    const systemMessages = buildMessages(prompt, contextConfig)
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');

    logger.info({ providerId }, 'Starting evaluation');
    const startTime = Date.now();
    const evaluation = await evaluateResponse(model, prompt, responseText, systemMessages);
    logger.info({ duration: Date.now() - startTime }, 'Evaluation completed');

    res.json(evaluation);
  } catch (error: any) {
    logger.error(error, 'Evaluate API error');
    res.status(500).json({ error: error?.message || 'Evaluation failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
