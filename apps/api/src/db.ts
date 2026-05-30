import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppSettings, OutputType } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dataDir, 'cortana.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const DEFAULTS: AppSettings = {
  searxngUrl: 'http://127.0.0.1:8080',
  llmBaseUrl: 'https://api.openai.com/v1',
  llmApiKey: '',
  llmModel: 'gpt-4o-mini',
  maxResults: 8,
  maxExtracts: 5,
  defaultOutputType: 'summary',
};

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id TEXT PRIMARY KEY,
      demand TEXT NOT NULL,
      search_type TEXT NOT NULL DEFAULT 'general',
      output_type TEXT NOT NULL DEFAULT 'summary',
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_queries (
      id TEXT PRIMARY KEY,
      search_id TEXT NOT NULL,
      query_text TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_results (
      id TEXT PRIMARY KEY,
      search_id TEXT NOT NULL,
      query_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      snippet TEXT NOT NULL DEFAULT '',
      engine TEXT NOT NULL DEFAULT '',
      score REAL NOT NULL DEFAULT 0,
      selected INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE,
      FOREIGN KEY (query_id) REFERENCES search_queries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS source_extracts (
      id TEXT PRIMARY KEY,
      search_id TEXT NOT NULL,
      result_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE,
      FOREIGN KEY (result_id) REFERENCES search_results(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS final_reports (
      id TEXT PRIMARY KEY,
      search_id TEXT NOT NULL,
      output_type TEXT NOT NULL,
      content TEXT NOT NULL,
      sources_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)'
  );
  for (const [key, value] of Object.entries(DEFAULTS)) {
    insertSetting.run(key, String(value));
  }
}

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM app_settings').all() as {
    key: string;
    value: string;
  }[];

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    searxngUrl: map.searxngUrl ?? DEFAULTS.searxngUrl,
    llmBaseUrl: map.llmBaseUrl ?? DEFAULTS.llmBaseUrl,
    llmApiKey: map.llmApiKey ?? DEFAULTS.llmApiKey,
    llmModel: map.llmModel ?? DEFAULTS.llmModel,
    maxResults: Number(map.maxResults ?? DEFAULTS.maxResults),
    maxExtracts: Number(map.maxExtracts ?? DEFAULTS.maxExtracts),
    defaultOutputType: (map.defaultOutputType as OutputType) ?? DEFAULTS.defaultOutputType,
  };
}

export function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const upsert = db.prepare(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) upsert.run(key, String(value));
  }
  return getSettings();
}
