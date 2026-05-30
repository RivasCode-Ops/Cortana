# CORTANA — Arquitetura V1

```
Usuário (React)
    │
    ▼
API Node (Express) ──► SQLite (data/cortana.db)
    │
    ├── Orchestrator
    │     ├── classify demand
    │     ├── generate sub-queries (LLM ou heurística)
    │     ├── SearXNG JSON search
    │     ├── rank & select URLs
    │     ├── extract page text (fetch + cheerio)
    │     └── synthesize report (LLM)
    │
    ├── SearXNG (http://127.0.0.1:8080/search?format=json)
    └── LLM (OpenAI-compatible endpoint)
```

## Tabelas

- `searches` — demanda original, tipo, status
- `search_queries` — subconsultas geradas
- `search_results` — links do SearXNG
- `source_extracts` — conteúdo extraído por URL
- `final_reports` — síntese final com fontes
- `app_settings` — chave/valor (SearXNG URL, LLM, limites)

## Tipos de saída

- `summary` — resumo com fontes
- `comparison` — comparação entre opções
- `shortlist` — shortlist recomendada
- `briefing` — briefing executivo
- `report` — relatório completo
- `directions` — direcionamentos para construir demanda
