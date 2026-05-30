import { v4 as uuid } from 'uuid';
import { db, getSettings } from '../db.js';
import type { OutputType, SearchProgress, SearchType } from '../types.js';
import {
  extractPageContent,
  isExtractableUrl,
  scoreResult,
} from './extractor.js';
import {
  classifyDemandHeuristic,
  generateQueriesWithLlm,
  synthesizeReport,
} from './llm.js';
import { searchSearxng, pingSearxng } from './searxng.js';
import { imageIdFromSrc, pickImageSrc, shouldUseImageSearch } from './image.js';

type ProgressCb = (p: SearchProgress) => void;

export async function runSearchPipeline(
  searchId: string,
  onProgress?: ProgressCb
): Promise<void> {
  const settings = getSettings();
  const search = db
    .prepare('SELECT * FROM searches WHERE id = ?')
    .get(searchId) as {
    id: string;
    demand: string;
    output_type: OutputType;
  };

  if (!search) throw new Error('Pesquisa não encontrada');

  const updateStatus = (status: string, error?: string) => {
    db.prepare(
      'UPDATE searches SET status = ?, error_message = ?, updated_at = ? WHERE id = ?'
    ).run(status, error ?? null, new Date().toISOString(), searchId);
  };

  try {
    onProgress?.({ phase: 'classify', message: 'Classificando demanda...', percent: 10 });
    updateStatus('running');

    const searxOk = await pingSearxng(settings);
    if (!searxOk) {
      throw new Error(
        `SearXNG offline (${settings.searxngUrl}). Abra o Docker Desktop e execute: docker compose up -d`
      );
    }

    const searchType: SearchType = classifyDemandHeuristic(search.demand);
    db.prepare('UPDATE searches SET search_type = ? WHERE id = ?').run(
      searchType,
      searchId
    );

    onProgress?.({ phase: 'queries', message: 'Gerando subconsultas...', percent: 20 });
    const queries = await generateQueriesWithLlm(search.demand, searchType, settings);

    const insertQuery = db.prepare(
      'INSERT INTO search_queries (id, search_id, query_text, position) VALUES (?, ?, ?, ?)'
    );
    const queryRows: { id: string; text: string }[] = [];
    queries.forEach((q, i) => {
      const id = uuid();
      insertQuery.run(id, searchId, q, i);
      queryRows.push({ id, text: q });
    });

    onProgress?.({ phase: 'search', message: 'Consultando SearXNG...', percent: 35 });
    const insertResult = db.prepare(
      `INSERT INTO search_results (id, search_id, query_id, title, url, snippet, engine, score, selected, img_src, image_id, result_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const allResults: {
      id: string;
      url: string;
      title: string;
      snippet: string;
      score: number;
      img_src?: string | null;
    }[] = [];
    const seenUrls = new Set<string>();
    const seenImageIds = new Set<string>();

    const ingestBatch = (
      results: Awaited<ReturnType<typeof searchSearxng>>,
      queryId: string,
      queryText: string,
      category: string
    ) => {
      for (const r of results.slice(0, settings.maxResults)) {
        if (!r.url || seenUrls.has(r.url)) continue;
        const imgSrc = pickImageSrc(r);
        const imageId = imgSrc ? imageIdFromSrc(imgSrc) : null;
        if (imageId && seenImageIds.has(imageId)) continue;

        seenUrls.add(r.url);
        if (imageId) seenImageIds.add(imageId);

        let score = scoreResult(r.title ?? '', r.content ?? '', search.demand, queryText);
        if (category === 'images' && imgSrc) score += 1.5;

        const id = uuid();
        insertResult.run(
          id,
          searchId,
          queryId,
          r.title ?? r.url,
          r.url,
          r.content ?? '',
          r.engine ?? '',
          score,
          0,
          imgSrc,
          imageId,
          category
        );
        allResults.push({
          id,
          url: r.url,
          title: r.title ?? r.url,
          snippet: r.content ?? '',
          score,
          img_src: imgSrc,
        });
      }
    };

    for (const q of queryRows) {
      const general = await searchSearxng(q.text, settings);
      ingestBatch(general, q.id, q.text, 'general');

      if (shouldUseImageSearch(searchType)) {
        const images = await searchSearxng(q.text, settings, { categories: 'images' });
        ingestBatch(images, q.id, q.text, 'images');
      }
    }

    allResults.sort((a, b) => b.score - a.score);
    const selected = allResults
      .filter((r) => isExtractableUrl(r.url))
      .slice(0, settings.maxExtracts);

    const markSelected = db.prepare(
      'UPDATE search_results SET selected = 1 WHERE id = ?'
    );
    selected.forEach((r) => markSelected.run(r.id));

    onProgress?.({ phase: 'extract', message: 'Extraindo conteúdo...', percent: 55 });
    updateStatus('extracting');

    const insertExtract = db.prepare(
      `INSERT INTO source_extracts (id, search_id, result_id, url, title, content, word_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const extracts: { url: string; title: string; content: string }[] = [];

    for (const r of selected) {
      try {
        const { title, content, wordCount } = await extractPageContent(r.url);
        insertExtract.run(uuid(), searchId, r.id, r.url, title, content, wordCount);
        extracts.push({ url: r.url, title, content });
      } catch {
        insertExtract.run(
          uuid(),
          searchId,
          r.id,
          r.url,
          r.title,
          `[Falha na extração — usar snippet]\n${r.snippet}`,
          r.snippet.split(/\s+/).length
        );
        extracts.push({
          url: r.url,
          title: r.title,
          content: r.snippet,
        });
      }
    }

    onProgress?.({ phase: 'synthesize', message: 'Gerando síntese...', percent: 80 });
    updateStatus('synthesizing');

    const reportContent = await synthesizeReport({
      demand: search.demand,
      searchType,
      outputType: search.output_type,
      extracts,
      snippets: allResults.map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
      })),
      settings,
    });

    const sources = extracts.length
      ? extracts.map((e) => ({ title: e.title, url: e.url }))
      : allResults.slice(0, 8).map((r) => ({ title: r.title, url: r.url }));

    db.prepare(
      `INSERT INTO final_reports (id, search_id, output_type, content, sources_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      uuid(),
      searchId,
      search.output_type,
      reportContent,
      JSON.stringify(sources),
      new Date().toISOString()
    );

    updateStatus('completed');
    onProgress?.({ phase: 'done', message: 'Pesquisa concluída', percent: 100 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    updateStatus('failed', msg);
    onProgress?.({ phase: 'error', message: msg, percent: 100 });
    throw err;
  }
}

export function getSearchDetail(searchId: string) {
  const search = db.prepare('SELECT * FROM searches WHERE id = ?').get(searchId);
  if (!search) return null;

  const queries = db
    .prepare('SELECT * FROM search_queries WHERE search_id = ? ORDER BY position')
    .all(searchId);
  const results = db
    .prepare('SELECT * FROM search_results WHERE search_id = ? ORDER BY score DESC')
    .all(searchId);
  const extracts = db
    .prepare('SELECT * FROM source_extracts WHERE search_id = ?')
    .all(searchId);
  const report = db
    .prepare('SELECT * FROM final_reports WHERE search_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(searchId);

  return { search, queries, results, extracts, report };
}
