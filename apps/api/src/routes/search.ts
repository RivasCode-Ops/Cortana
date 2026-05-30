import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db, getSettings } from '../db.js';
import type { OutputType } from '../types.js';
import { getSearchDetail, runSearchPipeline } from '../services/orchestrator.js';

export const searchRouter = Router();

const progressMap = new Map<string, { phase: string; message: string; percent: number }>();

searchRouter.post('/', async (req, res) => {
  const { demand, outputType } = req.body as {
    demand?: string;
    outputType?: OutputType;
  };

  if (!demand?.trim()) {
    res.status(400).json({ error: 'Demanda obrigatória' });
    return;
  }

  const settings = getSettings();
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO searches (id, demand, search_type, output_type, status, created_at, updated_at)
     VALUES (?, ?, 'general', ?, 'pending', ?, ?)`
  ).run(id, demand.trim(), outputType ?? settings.defaultOutputType, now, now);

  res.status(201).json({ id });

  setImmediate(async () => {
    progressMap.set(id, { phase: 'start', message: 'Iniciando...', percent: 5 });
    try {
      await runSearchPipeline(id, (p) => progressMap.set(id, p));
    } catch {
      /* status saved in db */
    }
  });
});

searchRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM searches ORDER BY created_at DESC LIMIT 50')
    .all();
  res.json(rows);
});

searchRouter.get('/:id', (req, res) => {
  const detail = getSearchDetail(req.params.id);
  if (!detail) {
    res.status(404).json({ error: 'Não encontrado' });
    return;
  }
  res.json(detail);
});

searchRouter.get('/:id/progress', (req, res) => {
  const p = progressMap.get(req.params.id);
  const search = db
    .prepare('SELECT status, error_message FROM searches WHERE id = ?')
    .get(req.params.id) as { status: string; error_message: string | null } | undefined;

  if (!search) {
    res.status(404).json({ error: 'Não encontrado' });
    return;
  }

  res.json({
    ...(p ?? { phase: search.status, message: search.status, percent: 0 }),
    status: search.status,
    error: search.error_message,
  });
});

searchRouter.post('/:id/refine', async (req, res) => {
  const original = db
    .prepare('SELECT * FROM searches WHERE id = ?')
    .get(req.params.id) as { demand: string; output_type: OutputType } | undefined;

  if (!original) {
    res.status(404).json({ error: 'Não encontrado' });
    return;
  }

  const { refinement, outputType } = req.body as {
    refinement?: string;
    outputType?: OutputType;
  };

  const demand = refinement?.trim()
    ? `${original.demand}\n\nRefinamento: ${refinement.trim()}`
    : original.demand;

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO searches (id, demand, search_type, output_type, status, created_at, updated_at)
     VALUES (?, ?, 'general', ?, 'pending', ?, ?)`
  ).run(id, demand, outputType ?? original.output_type, now, now);

  res.status(201).json({ id });

  setImmediate(async () => {
    progressMap.set(id, { phase: 'start', message: 'Refinando...', percent: 5 });
    try {
      await runSearchPipeline(id, (p) => progressMap.set(id, p));
    } catch {
      /* handled */
    }
  });
});
