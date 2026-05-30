# Busca por imagem — análise para a Cortana

## GitHub **não** tem busca por imagem

A API do GitHub é **só texto** (repos, code, issues). Não existe endpoint oficial de reverse image search ou identificador visual de repositório.

Repos no GitHub com identificadores de imagem (referência, não busca no GitHub):

| Repo | Identificador | Uso | Encaixa na Cortana? |
|------|---------------|-----|---------------------|
| [JohannesBuchner/imagehash](https://github.com/JohannesBuchner/imagehash) | **pHash / dHash** | Duplicatas visuais | ⚠️ Python — pesado portar |
| [Wikimedia ImageHash-Toolforge](https://github.com/Wikimedia-Suomi/ImageHash-Toolforge) | `dhash` + `phash` numéricos | Busca similar local | ⚠️ Serviço externo |
| [vivithemage/mrisa](https://github.com/vivithemage/mrisa) | URL → Google reverse | Reverse image search | ⚠️ Scraping Google |
| [TechyNilesh/DeepImageSearch](https://github.com/TechyNilesh/DeepImageSearch) | Embeddings CLIP | Texto↔imagem | ❌ Pesado (4 GB RAM) |

---

## O que **integra agora** com o código Cortana: SearXNG `categories=images`

O SearXNG já usado em `apps/api/src/services/searxng.ts` suporta busca só de imagens:

```
GET /search?q=...&categories=images&format=json
```

Cada resultado traz identificadores úteis:

| Campo SearXNG | Função |
|--------------|--------|
| `img_src` | URL direta da imagem (**identificador principal**) |
| `thumbnail_src` | Preview rápido |
| `url` | Página de origem |
| `resolution` / `img_format` | Metadados |

**Por que é mais rápido:**
- Não precisa extrair HTML da página para achar foto de produto
- Menos fetch + cheerio no pipeline
- Resultados visuais diretos para fornecedor / equipamento / comparação

---

## Implementado na Cortana (V1.1)

1. `searchSearxng(query, settings, { categories: 'images' })` — busca paralela
2. Tipos de pesquisa `suppliers`, `market_research`, `comparison` disparam **general + images**
3. Coluna `img_src` + `image_id` (hash da URL) em `search_results` — deduplicação
4. UI mostra thumbnails nos resultados com imagem

---

## Fora do escopo (V1)

- Upload de imagem + reverse search (mrisa / SerpApi)
- pHash local em Node (precisa lib nativa ou microserviço Python)
- CLIP / FAISS (inviável no notebook 4 GB)

## V2 sugerida

- Endpoint `POST /api/searches/by-image` com upload
- Microserviço Python mínimo com `imagehash` para pHash
- Cache SQLite de `image_id → resultados` para repetir buscas instantâneas
