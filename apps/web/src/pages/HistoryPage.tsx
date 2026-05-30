import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cortanaApi, OUTPUT_LABELS, type SearchSummary } from '../api';

export function HistoryPage() {
  const [items, setItems] = useState<SearchSummary[]>([]);

  useEffect(() => {
    cortanaApi.listSearches().then(setItems);
  }, []);

  return (
    <>
      <h1>Histórico</h1>
      <p className="muted">Pesquisas salvas localmente no SQLite.</p>
      <div className="card">
        {items.length === 0 && <p className="muted">Nenhuma pesquisa ainda.</p>}
        <ul className="link-list">
          {items.map((s) => (
            <li key={s.id}>
              <Link to={`/results/${s.id}`}>
                {s.demand.slice(0, 80)}
                {s.demand.length > 80 ? '...' : ''}
              </Link>
              <div className="muted">
                <span className="badge">{s.status}</span>{' '}
                {OUTPUT_LABELS[s.output_type as keyof typeof OUTPUT_LABELS]} ·{' '}
                {new Date(s.created_at).toLocaleString('pt-BR')}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
