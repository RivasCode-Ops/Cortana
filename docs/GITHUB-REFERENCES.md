# Referências GitHub — rodada Cortana (2026-05-30)

## Repos analisados

| Repo | O que aproveitar na Cortana |
|------|----------------------------|
| [vakovalskii/searcharvester](https://github.com/vakovalskii/searcharvester) | Fluxo SearXNG + extração markdown; API `/search` + `/extract` |
| [bettyguo/local-deep-research](https://github.com/bettyguo/local-deep-research) | Pipeline local-first: busca → RAG → síntese; CLI enxuta |
| [ItzCrazyKns/Vane](https://github.com/ItzCrazyKns/Vane) (ex-Perplexica) | UX de pesquisa com fontes; SearXNG + LLM plugável; histórico local |
| [Jay4242/llm-websearch](https://github.com/Jay4242/llm-websearch) | Agente mínimo LLM + SearXNG self-hosted |
| [pkoretic/WebSearchAgent](https://github.com/pkoretic/WebSearchAgent) | Orquestração Deno + SearXNG (referência de subconsultas) |
| [gefsikatsinelou/MetaSearchMCP](https://github.com/gefsikatsinelou/MetaSearchMCP) | Agregação multi-engine, deduplicação, JSON estruturado |
| [RivasCode-Ops/ARBILOCAL](https://github.com/RivasCode-Ops/ARBILOCAL) | Busca web + dashboard + síntese para decisão comercial |

## Decisões aplicadas

- **Adotar agora:** pipeline busca → extração → síntese com fontes obrigatórias
- **Adotar agora:** SearXNG JSON self-hosted (docker-compose incluído)
- **Adotar agora:** SQLite local para histórico completo
- **Adotar agora:** LLM OpenAI-compatible (OpenAI, Claude via proxy, Ollama)
- **Adaptar:** classificação de demanda + subconsultas (inspirado em agentes Perplexica/Vane)
- **Não adotar:** Playwright/browser automation pesada (fora do escopo V1)
- **Não adotar:** RAG vetorial/FAISS na V1 (complexidade desnecessária)

## Próximo foco (pós-V1)

- Modos de pesquisa (rápido / balanceado / profundo) como Vane
- Extração com trafilatura (searcharvester)
- Integração ARBILOCAL para demandas de fornecedor/revenda
