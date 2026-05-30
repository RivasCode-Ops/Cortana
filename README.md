# CORTANA

App local de **pesquisa inteligente**: SearXNG + IA + histórico SQLite.

Transforma demandas em linguagem natural em respostas estruturadas com fontes.

## Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + TypeScript (Express)
- **Banco:** SQLite (`apps/api/data/cortana.db`)
- **Busca:** SearXNG self-hosted
- **IA:** OpenAI-compatible (OpenAI, Claude proxy, Ollama, etc.)

## Referências aplicadas

Ver `docs/GITHUB-REFERENCES.md` e `docs/WORKBENCH-NOTES.md`.

## Pré-requisitos

- Node.js 20+
- Docker (opcional, para SearXNG)

## Instalação

```powershell
cd c:\_PROJETOS\Cortana
npm install
```

## SearXNG (busca web)

```powershell
docker compose up -d
```

URL padrão: `http://127.0.0.1:8080`

## Desenvolvimento

```powershell
npm run dev
```

- API: http://127.0.0.1:8787
- Web: http://127.0.0.1:5173

## Configuração

1. Abra **Configurações** no app
2. Informe URL do SearXNG
3. Configure endpoint + chave + modelo de IA
4. Salve

## Fluxo V1

1. Demanda em linguagem natural
2. Classificação + subconsultas
3. Busca SearXNG (JSON)
4. Seleção e extração de páginas
5. Síntese com IA (somente conteúdo extraído)
6. Histórico local

## Tipos de saída

- Resumo, comparação, shortlist, briefing, relatório, direcionamentos

## Produção local

```powershell
npm run build
npm start
```

Serve API + frontend buildado em http://127.0.0.1:8787
