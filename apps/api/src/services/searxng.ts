import type { AppSettings, SearxResult, SearxSearchOptions } from '../types.js';

export class SearxngError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearxngError';
  }
}

export async function searchSearxng(
  query: string,
  settings: AppSettings,
  options: SearxSearchOptions = {}
): Promise<SearxResult[]> {
  const base = settings.searxngUrl.replace(/\/$/, '');
  const url = new URL(`${base}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('language', 'pt-BR');
  if (options.categories) {
    url.searchParams.set('categories', options.categories);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new SearxngError(
      `SearXNG offline em ${base}. Inicie o Docker Desktop e rode: docker compose up -d`
    );
  }

  if (!res.ok) {
    throw new SearxngError(`SearXNG respondeu ${res.status}. Verifique ${base}`);
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
