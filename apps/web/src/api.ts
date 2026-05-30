export type OutputType =
  | 'summary'
  | 'comparison'
  | 'shortlist'
  | 'briefing'
  | 'report'
  | 'directions';

export interface SearchSummary {
  id: string;
  demand: string;
  search_type: string;
  output_type: OutputType;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface SearchDetail {
  search: SearchSummary;
  queries: { id: string; query_text: string; position: number }[];
  results: {
    id: string;
    title: string;
    url: string;
    snippet: string;
    score: number;
    selected: number;
    img_src?: string | null;
    result_category?: string;
  }[];
  extracts: {
    id: string;
    url: string;
    title: string;
    content: string;
    word_count: number;
  }[];
  report: {
    content: string;
    sources_json: string;
    output_type: OutputType;
  } | null;
}

export interface AppSettings {
  searxngUrl: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmModel: string;
  maxResults: number;
  maxExtracts: number;
  defaultOutputType: OutputType;
}

export const OUTPUT_LABELS: Record<OutputType, string> = {
  summary: 'Resumo com fontes',
  comparison: 'Comparação',
  shortlist: 'Shortlist recomendada',
  briefing: 'Briefing',
  report: 'Relatório completo',
  directions: 'Direcionamentos',
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const cortanaApi = {
  health: () => api<{ ok: boolean }>('/api/health'),
  listSearches: () => api<SearchSummary[]>('/api/searches'),
  getSearch: (id: string) => api<SearchDetail>(`/api/searches/${id}`),
  getProgress: (id: string) =>
    api<{ phase: string; message: string; percent: number; status: string; error?: string }>(
      `/api/searches/${id}/progress`
    ),
  createSearch: (demand: string, outputType: OutputType) =>
    api<{ id: string }>('/api/searches', {
      method: 'POST',
      body: JSON.stringify({ demand, outputType }),
    }),
  refineSearch: (id: string, refinement: string, outputType?: OutputType) =>
    api<{ id: string }>(`/api/searches/${id}/refine`, {
      method: 'POST',
      body: JSON.stringify({ refinement, outputType }),
    }),
  getSettings: () => api<AppSettings>('/api/settings'),
  saveSettings: (data: Partial<AppSettings>) =>
    api<AppSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  settingsHealth: () =>
    api<{ searxng: boolean; llmConfigured: boolean; searxngUrl: string }>(
      '/api/settings/health'
    ),
  testLlm: (data?: Partial<Pick<AppSettings, 'llmBaseUrl' | 'llmModel' | 'llmApiKey'>>) =>
    api<{ ok: boolean; message: string }>('/api/settings/test-llm', {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    }),
};
