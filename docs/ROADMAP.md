# Cortana — Roadmap priorizado

Estimativas para **1 dev**, máquina local (Ultra UB422).  
Legenda de esforço: **S** = 0,5–1 dia · **M** = 2–3 dias · **L** = 1 semana+

---

## Estado atual (V1 + V1.2 parcial)

| Área | Status |
|------|--------|
| Pipeline busca → extração → síntese | ✅ |
| SearXNG + SQLite + histórico | ✅ |
| Busca por imagem (SearXNG categories) | ✅ |
| Heurísticas leilão/fornecedor | ✅ |
| Extração Readability (V1.2) | ✅ |
| Exportar relatório MD / copiar | ✅ |
| Testar conexão IA | ✅ |
| Testes automatizados / CI | ❌ |

**Maturidade estimada:** 6,5/10 (uso pessoal) · 4,5/10 (produto comercial)

---

## V1.2 — Qualidade imediata (esta entrega)

| # | Item | Esforço | Impacto | Status |
|---|------|---------|---------|--------|
| 1 | Extração Readability + fallback cheerio | M | Alto | ✅ |
| 2 | Exportar relatório (MD + copiar) | S | Alto | ✅ |
| 3 | Botão "Testar IA" nas configurações | S | Alto | ✅ |
| 4 | UX: erros inline, texto PT, refine com try/catch | S | Médio | ✅ |

---

## V1.3 — Confiabilidade e UX (próximo sprint)

| # | Item | Esforço | Impacto | Notas |
|---|------|---------|---------|-------|
| 5 | Smoke test API + CI GitHub Actions | M | Alto | `build`, ping health, 1 pipeline mock |
| 6 | Modos de pesquisa (rápido / balanceado / profundo) | M | Alto | Ajusta `maxResults`, `maxExtracts`, queries |
| 7 | Classificação de demanda via LLM (fallback regex) | S | Médio | `classifyDemandWithLlm()` |
| 8 | Cancelar pesquisa em andamento | S | Médio | Flag em memória + status `cancelled` |
| 9 | Histórico: filtro status + paginação | S | Médio | `GET /searches?status=&offset=` |
| 10 | Progresso persistido (sobrevive restart API) | M | Médio | Coluna `progress_json` em `searches` |
| 11 | Testar SearXNG nas configurações (botão) | S | Baixo | Similar ao test-llm |
| 12 | `.env.example` + README troubleshooting | S | Médio | Documentar Docker + IA |

---

## V2 — Diferenciais

| # | Item | Esforço | Impacto | Notas |
|---|------|---------|---------|-------|
| 13 | Integração ARBILOCAL (fornecedor/comercial) | L | Alto | API ou módulo compartilhado |
| 14 | Busca reversa por upload de imagem | L | Médio | Ver `docs/IMAGE-SEARCH.md` V2 |
| 15 | Fila de jobs (concurrency limit) | M | Médio | Evita 3 pesquisas pesadas em 4 GB RAM |
| 16 | Streaming síntese (SSE) | M | Médio | UX Perplexica-like |
| 17 | Playwright tier opcional (sites JS) | L | Alto | Só modo "profundo", opt-in |
| 18 | Pacote `@cortana/types` compartilhado | S | Baixo | DRY api/web |
| 19 | Criptografia chave API (OS keychain) | M | Médio | Windows Credential Manager |
| 20 | Auth multi-usuário | L | Baixo* | *Só se expor na rede |

---

## Meta 10/10 — Checklist

Para considerar o produto **10/10** no escopo local-first:

- [ ] Pipeline passa em CI a cada push
- [ ] Extração útil em ≥70% dos top-5 links (benchmark manual)
- [ ] Síntese com IA configurada em ≤2 min na máquina alvo
- [ ] Erros acionáveis (SearXNG, IA, timeout) em PT
- [ ] Export PDF ou MD profissional com fontes numeradas
- [ ] Modos rápido/profundo documentados e testados
- [ ] Zero strings EN soltas na UI
- [ ] Runbook: Docker, IA, 4 GB RAM, recovery

---

## Ordem recomendada de execução

```
V1.2 (feito) → V1.3 items 5,6,7 → V1.3 items 8–12 → V2 item 13 ou 16
```

Priorize **CI + modos de pesquisa** antes de ARBILOCAL — maior ganho por esforço.
