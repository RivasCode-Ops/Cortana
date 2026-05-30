import * as cheerio from 'cheerio';

const BLOCKED = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com'];

export async function extractPageContent(
  url: string
): Promise<{ title: string; content: string; wordCount: number }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CortanaBot/0.1 (+local research)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(12000),
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside, noscript').remove();

  const title = $('title').first().text().trim() || url;
  const main =
    $('main').text().trim() ||
    $('article').text().trim() ||
    $('body').text().trim();

  const content = main.replace(/\s+/g, ' ').trim().slice(0, 8000);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return { title, content, wordCount };
}

export function isExtractableUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !BLOCKED.some((b) => host.includes(b));
  } catch {
    return false;
  }
}

export function scoreResult(
  title: string,
  snippet: string,
  demand: string,
  query: string
): number {
  const text = `${title} ${snippet}`.toLowerCase();
  const terms = [
    ...new Set([
      ...demand.toLowerCase().split(/\s+/),
      ...query.toLowerCase().split(/\s+/),
    ]),
  ]
    .filter((t) => t.length > 3)
    .slice(0, 12);

  let score = 0;
  for (const term of terms) {
    if (text.includes(term)) score += 1;
  }
  if (snippet.length > 80) score += 0.5;
  if (/\.pdf$/i.test(title)) score -= 1;
  return score;
}
