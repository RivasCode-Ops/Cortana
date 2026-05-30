import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';

const BLOCKED = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com'];

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function normalizeContent(text: string, maxLen = 8000): { content: string; wordCount: number } {
  const content = text.replace(/\s+/g, ' ').trim().slice(0, maxLen);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return { content, wordCount };
}

function extractWithReadability(
  html: string,
  url: string
): { title: string; content: string; wordCount: number } | null {
  try {
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    if (!article?.textContent?.trim()) return null;

    const { content, wordCount } = normalizeContent(article.textContent);
    if (wordCount < 30) return null;

    return {
      title: article.title?.trim() || url,
      content,
      wordCount,
    };
  } catch {
    return null;
  }
}

function extractWithCheerio(html: string, url: string): { title: string; content: string; wordCount: number } {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside, noscript').remove();

  const title = $('title').first().text().trim() || url;
  const main =
    $('main').text().trim() ||
    $('article').text().trim() ||
    $('body').text().trim();

  const { content, wordCount } = normalizeContent(main);
  return { title, content, wordCount };
}

export async function extractPageContent(
  url: string
): Promise<{ title: string; content: string; wordCount: number }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(12000),
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const html = await res.text();
  const readable = extractWithReadability(html, url);
  const cheerioResult = extractWithCheerio(html, url);

  if (readable && readable.wordCount >= cheerioResult.wordCount) {
    return readable;
  }
  return cheerioResult;
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
