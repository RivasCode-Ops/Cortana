import type { AppSettings, SearxResult } from '../types.js';

export async function searchSearxng(
  query: string,
  settings: AppSettings
): Promise<SearxResult[]> {
  const base = settings.searxngUrl.replace(/\/$/, '');
  const url = new URL(`${base}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'pt-BR');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`SearXNG respondeu ${res.status}. Verifique se está rodando em ${base}`);
  }

  const data = (await res.json()) as { results?: SearxResult[] };
  return data.results ?? [];
}

export async function pingSearxng(settings: AppSettings): Promise<boolean> {
  try {
    const base = settings.searxngUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/search?q=test&format=json`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
