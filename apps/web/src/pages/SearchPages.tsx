import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { cortanaApi, OUTPUT_LABELS, type SearchDetail } from '../api';

function buildExportMarkdown(
  detail: SearchDetail,
  sources: { title: string; url: string }[]
): string {
  const lines = [
    `# Cortana — ${OUTPUT_LABELS[detail.search.output_type]}`,
    '',
    `**Demanda:** ${detail.search.demand}`,
    '',
    `**Data:** ${new Date(detail.search.created_at).toLocaleString('pt-BR')}`,
    '',
    '---',
    '',
  ];
  if (detail.report) {
    lines.push(detail.report.content, '', '---', '', '## Fontes', '');
    sources.forEach((s, i) => lines.push(`${i + 1}. [${s.title}](${s.url})`));
  }
  return lines.join('\n');
}

export function SearchRunPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState({ message: 'Iniciando...', percent: 0, status: 'pending' });
  const [detail, setDetail] = useState<SearchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const poll = async () => {
      try {
        const p = await cortanaApi.getProgress(id);
        if (!active) return;
        setProgress({ message: p.message, percent: p.percent, status: p.status });
        if (p.error) setError(p.error);

        if (p.status === 'completed') {
          navigate(`/results/${id}`, { replace: true });
          return;
        }
        if (p.status === 'failed') {
          setError(p.error ?? 'Falha na pesquisa');
          const d = await cortanaApi.getSearch(id);
          if (active) setDetail(d);
          return;
        }

        setTimeout(poll, 1200);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erro');
      }
    };

    poll();
    return () => {
      active = false;
    };
  }, [id, navigate]);

  return (
    <>
      <h1>Executando pesquisa</h1>
      <div className="card">
        <p>{progress.message}</p>
        <div className="progress-bar">
          <div style={{ width: `${Math.max(progress.percent, 5)}%` }} />
        </div>
        <span className="badge">{progress.status}</span>
        {error && (
          <div className="card" style={{ marginTop: 12, borderColor: '#7f1d1d' }}>
            <p className="error">{error}</p>
            {error.includes('SearXNG') && (
              <p className="muted">
                1. Abra o <strong>Docker Desktop</strong>
                <br />
                2. No terminal: <code>docker compose up -d</code> (pasta Cortana)
                <br />
                3. Aguarde ~30s e pesquise de novo
              </p>
            )}
            {!error.includes('SearXNG') && error.includes('IA') && (
              <p className="muted">Configure a chave de IA em Configurações para síntese completa.</p>
            )}
          </div>
        )}
        {detail && (
          <p className="muted" style={{ marginTop: 12 }}>
            Demanda: {detail.search.demand}
          </p>
        )}
        {error && id && (
          <Link to={`/results/${id}`} style={{ display: 'inline-block', marginTop: 12 }}>
            Ver resultados parciais
          </Link>
        )}
      </div>
    </>
  );
}

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SearchDetail | null>(null);
  const [refine, setRefine] = useState('');
  const [refineError, setRefineError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    cortanaApi.getSearch(id).then(setDetail).catch(console.error);
  }, [id]);

  async function handleRefine() {
    if (!id || !refine.trim()) return;
    setRefineError(null);
    try {
      const { id: newId } = await cortanaApi.refineSearch(id, refine.trim());
      navigate(`/search/${newId}`);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'Erro ao refinar');
    }
  }

  function downloadReport() {
    if (!detail) return;
    const sources = detail.report
      ? (JSON.parse(detail.report.sources_json) as { title: string; url: string }[])
      : [];
    const md = buildExportMarkdown(detail, sources);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cortana-${detail.search.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copyReport() {
    if (!detail?.report) return;
    const sources = JSON.parse(detail.report.sources_json) as { title: string; url: string }[];
    await navigator.clipboard.writeText(buildExportMarkdown(detail, sources));
    setCopyMsg('Copiado!');
    setTimeout(() => setCopyMsg(null), 2000);
  }

  if (!detail) return <p className="muted">Carregando...</p>;

  const sources = detail.report
    ? (JSON.parse(detail.report.sources_json) as { title: string; url: string }[])
    : [];

  return (
    <>
      <h1>Resultados</h1>
      <p className="muted">{detail.search.demand}</p>

      <div className="card">
        <h2>Consultas geradas</h2>
        <ul>
          {detail.queries.map((q) => (
            <li key={q.id}>{q.query_text}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Links encontrados ({detail.results.length})</h2>
        <ul className="link-list">
          {detail.results.slice(0, 15).map((r) => (
            <li key={r.id}>
              {r.selected ? '★ ' : ''}
              {r.result_category === 'images' && <span className="badge">img </span>}
              {r.img_src && (
                <img
                  src={r.img_src}
                  alt=""
                  width={48}
                  height={48}
                  style={{ verticalAlign: 'middle', marginRight: 8, objectFit: 'cover', borderRadius: 4 }}
                  loading="lazy"
                />
              )}
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <div className="muted">{r.snippet.slice(0, 120)}...</div>
            </li>
          ))}
        </ul>
      </div>

      {detail.extracts.length > 0 && (
        <div className="card">
          <h2>Conteúdo extraído ({detail.extracts.length})</h2>
          {detail.extracts.map((e) => (
            <div key={e.id} style={{ marginBottom: 12 }}>
              <strong>{e.title}</strong>
              <p className="muted">{e.content.slice(0, 300)}...</p>
            </div>
          ))}
        </div>
      )}

      {detail.report && (
        <div className="card">
          <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Síntese final</h2>
            <div className="btn-row">
              <button type="button" className="secondary" onClick={copyReport}>
                Copiar
              </button>
              <button type="button" className="secondary" onClick={downloadReport}>
                Baixar .md
              </button>
            </div>
          </div>
          {copyMsg && <p className="success">{copyMsg}</p>}
          <div className="markdown">
            <ReactMarkdown>{detail.report.content}</ReactMarkdown>
          </div>
          <h2 style={{ marginTop: 16 }}>Fontes</h2>
          <ul className="link-list">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Refinar pesquisa</h2>
        <textarea
          value={refine}
          onChange={(e) => setRefine(e.target.value)}
          placeholder="Ex: focar em fornecedores do Nordeste com MOQ baixo"
        />
        <button type="button" onClick={handleRefine} style={{ marginTop: 8 }}>
          Refinar e pesquisar de novo
        </button>
        {refineError && <p className="error">{refineError}</p>}
      </div>
    </>
  );
}
