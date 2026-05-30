export type SearchType =
  | 'suppliers'
  | 'comparison'
  | 'market_research'
  | 'commercial_proposal'
  | 'app_references'
  | 'general';

export type OutputType =
  | 'summary'
  | 'comparison'
  | 'shortlist'
  | 'briefing'
  | 'report'
  | 'directions';

export type SearchStatus =
  | 'pending'
  | 'running'
  | 'extracting'
  | 'synthesizing'
  | 'completed'
  | 'failed';

export interface SearchRow {
  id: string;
  demand: string;
  search_type: SearchType;
  output_type: OutputType;
  status: SearchStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchQueryRow {
  id: string;
  search_id: string;
  query_text: string;
  position: number;
}

export interface SearchResultRow {
  id: string;
  search_id: string;
  query_id: string;
  title: string;
  url: string;
  snippet: string;
  engine: string;
  score: number;
  selected: number;
}

export interface SourceExtractRow {
  id: string;
  search_id: string;
  result_id: string;
  url: string;
  title: string;
  content: string;
  word_count: number;
}

export interface FinalReportRow {
  id: string;
  search_id: string;
  output_type: OutputType;
  content: string;
  sources_json: string;
  created_at: string;
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

export interface SearxResult {
  title: string;
  url: string;
  content?: string;
  engine?: string;
}

export interface SearchProgress {
  phase: string;
  message: string;
  percent: number;
}
