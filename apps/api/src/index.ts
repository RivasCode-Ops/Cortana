import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb } from './db.js';
import { searchRouter } from './routes/search.js';
import { settingsRouter } from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8787);

initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'cortana-api', version: '0.1.0' });
});

app.use('/api/searches', searchRouter);
app.use('/api/settings', settingsRouter);

const webDist = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Frontend não buildado. Rode npm run dev na raiz.' });
  });
});

app.listen(PORT, () => {
  console.log(`Cortana API http://127.0.0.1:${PORT}`);
});
