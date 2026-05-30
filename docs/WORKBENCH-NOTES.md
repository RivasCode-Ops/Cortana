# Notas Workbench → Cortana

Alinhamento com [RivasCode-Ops/workbench](https://github.com/RivasCode-Ops/workbench):

## Etapa ativa: 20-ENTREGA-DE-PRODUTO

- Demanda classificada: **produto novo** (CORTANA)
- Escopo V1 definido no prompt do usuário
- Exploração registrada em `docs/GITHUB-REFERENCES.md`

## Governança mínima

| Arquivo | Uso |
|---------|-----|
| `docs/GITHUB-REFERENCES.md` | Benchmark de repos (HISTORICO-EXPLORACAO) |
| `README.md` | Entrada do produto |
| `docs/ARCHITECTURE.md` | Arquitetura funcional |

## Regras do método aplicadas

1. Não implementar sem entender o fluxo ponta a ponta
2. Priorizar fundação funcional antes de polish
3. Busca antes de síntese — nunca chute sem fontes
4. Local-first (SQLite, SearXNG local)

## Handoff para próxima sessão

- Rodar `npm install` na raiz
- Subir SearXNG: `docker compose up -d` (se Docker disponível)
- Configurar IA em `/settings`
- Testar demanda exemplo no dashboard
