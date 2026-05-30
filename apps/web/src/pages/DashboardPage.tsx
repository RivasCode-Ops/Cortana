import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cortanaApi, OUTPUT_LABELS, type OutputType } from '../api';

const EXAMPLES = [
  'ache fornecedores de cosméticos para revenda',
  'compare sistemas open source para salão',
  'pesquise máquinas para cafeteria pequena',
  'levante informações para construir uma proposta comercial',
  'encontre referências para desenvolver um app',
];

export function DashboardPage() {
  const [demand, setDemand] = useState('');
  const [outputType, setOutputType] = useState<OutputType>('summary');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<{ searxng: boolean; llm: boolean } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    cortanaApi.settingsHealth().then((h) =>
      setHealth({ searxng: h.searxng, llm: h.llmConfigured })
    );
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!demand.trim()) return;
    setLoading(true);
    try {
      const { id } = await cortanaApi.createSearch(demand.trim(), outputType);
      navigate(`/search/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao iniciar pesquisa');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Pesquisa inteligente</h1>
      <p className="muted">
        Descreva sua demanda em linguagem natural. A Cortana busca, extrai e sintetiza com fontes.
      </p>

      {health && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <span className="badge" style={{ marginRight: 8 }}>
            SearXNG: {health.searxng ? 'online' : 'offline'}
          </span>
          <span className="badge">IA: {health.llm ? 'configurada' : 'não configurada'}</span>
          {!health.searxng && (
            <p className="muted" style={{ marginTop: 8 }}>
              Suba o SearXNG: <code>docker compose up -d</code>
            </p>
          )}
        </div>
      )}

      <form className="card" onSubmit={submit} style={{ marginTop: '1rem' }}>
        <label>
          <h2>Sua demanda</h2>
          <textarea
            value={demand}
            onChange={(e) => setDemand(e.target.value)}
            placeholder="Ex: ache fornecedores de cosméticos para revenda no Brasil..."
          />
        </label>

        <label style={{ display: 'block', marginTop: '1rem' }}>
          <h2>Tipo de saída</h2>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as OutputType)}
          >
            {(Object.keys(OUTPUT_LABELS) as OutputType[]).map((k) => (
              <option key={k} value={k}>
                {OUTPUT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={loading || !demand.trim()} style={{ marginTop: '1rem' }}>
          {loading ? 'Iniciando...' : 'Pesquisar'}
        </button>
      </form>

      <div className="card">
        <h2>Exemplos</h2>
        <ul className="link-list">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                className="secondary"
                style={{ background: 'transparent', color: '#7eb8ff', padding: 0 }}
                onClick={() => setDemand(ex)}
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
