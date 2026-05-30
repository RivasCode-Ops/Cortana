import { Router } from 'express';
import { getSettings, saveSettings } from '../db.js';
import { testLlmConnection } from '../services/llm.js';
import { pingSearxng } from '../services/searxng.js';
import type { AppSettings } from '../types.js';

export const settingsRouter = Router();

settingsRouter.get('/', (_req, res) => {
  const s = getSettings();
  res.json({
    ...s,
    llmApiKey: s.llmApiKey ? '***configured***' : '',
  });
});

settingsRouter.put('/', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const partial: Record<string, string | number> = {};

  if (typeof body.searxngUrl === 'string') partial.searxngUrl = body.searxngUrl;
  if (typeof body.llmBaseUrl === 'string') partial.llmBaseUrl = body.llmBaseUrl;
  if (typeof body.llmModel === 'string') partial.llmModel = body.llmModel;
  if (typeof body.defaultOutputType === 'string') partial.defaultOutputType = body.defaultOutputType;
  if (body.maxResults !== undefined) partial.maxResults = Number(body.maxResults);
  if (body.maxExtracts !== undefined) partial.maxExtracts = Number(body.maxExtracts);
  if (typeof body.llmApiKey === 'string' && body.llmApiKey && body.llmApiKey !== '***configured***') {
    partial.llmApiKey = body.llmApiKey;
  }

  const saved = saveSettings(partial);
  res.json({
    ...saved,
    llmApiKey: saved.llmApiKey ? '***configured***' : '',
  });
});

settingsRouter.get('/health', async (_req, res) => {
  const settings = getSettings();
  const searxng = await pingSearxng(settings);
  res.json({
    searxng,
    llmConfigured: Boolean(settings.llmApiKey),
    searxngUrl: settings.searxngUrl,
  });
});

settingsRouter.post('/test-llm', async (req, res) => {
  const saved = getSettings();
  const body = req.body as Partial<AppSettings>;
  const settings: AppSettings = {
    ...saved,
    ...(typeof body.llmBaseUrl === 'string' && { llmBaseUrl: body.llmBaseUrl }),
    ...(typeof body.llmModel === 'string' && { llmModel: body.llmModel }),
    ...(typeof body.llmApiKey === 'string' &&
      body.llmApiKey &&
      body.llmApiKey !== '***configured***' && { llmApiKey: body.llmApiKey }),
  };
  const result = await testLlmConnection(settings);
  res.json(result);
});
