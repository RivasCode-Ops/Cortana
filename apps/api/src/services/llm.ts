import type { AppSettings, OutputType, SearchType } from '../types.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(
  settings: AppSettings,
  messages: ChatMessage[],
  temperature = 0.3
): Promise<string> {
  if (!settings.llmApiKey) {
    throw new Error('Configure a chave da IA em Configurações');
  }

  const base = settings.llmBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.llmApiKey}`,
    },
    body: JSON.stringify({
      model: settings.llmModel,
      messages,
      temperature,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM erro ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function testLlmConnection(
  settings: AppSettings
): Promise<{ ok: boolean; message: string }> {
  if (!settings.llmApiKey) {
    return { ok: false, message: 'Configure a chave da IA antes de testar.' };
  }
  try {
    const reply = await chatCompletion(
      settings,
      [{ role: 'user', content: 'Responda em uma palavra: OK' }],
      0
    );
    return { ok: true, message: `Conexão OK — resposta: ${reply.slice(0, 80)}` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Falha ao conectar na IA',
    };
  }
}

export function classifyDemandHeuristic(demand: string): SearchType {
  const d = demand.toLowerCase();
  if (/fornecedor|revenda|distribuidor|atacado/.test(d)) return 'suppliers';
  if (/compar| versus | vs |melhor entre/.test(d)) return 'comparison';
  if (/proposta comercial|briefing|cliente/.test(d)) return 'commercial_proposal';
  if (/app|aplicativo|software|sistema open source/.test(d)) return 'app_references';
  if (/leil[aã]o|ve[ií]culo|autom[oó]vel|carro|onix|detran|tomado|apreendid|financiamento/.test(d)) {
    return 'market_research';
  }
  if (/máquina|equipamento|investimento|mercado/.test(d)) return 'market_research';
  return 'general';
}

/** Primeira linha / trecho antes de "Refinamento:" — evita queries gigantes no SearXNG. */
export function extractDemandCore(demand: string): string {
  const line = demand.split(/\n+/)[0]?.trim() ?? demand.trim();
  const beforeRefine = line.split(/refinamento\s*:/i)[0]?.trim() ?? line;
  return beforeRefine.slice(0, 200);
}

function auctionQueries(demand: string): string[] {
  const core = extractDemandCore(demand);
  const d = demand.toLowerCase();
  const model = /\bonix\b/i.test(d) ? 'Onix 2025' : 'veículo';
  return [
    `${model} leilão banco apreensão Brasil`,
    `leilão ${model} DETRAN financiamento`,
    `como encontrar ${model} antes leilão banco`,
    `${core} site:gov.br OR site:com.br leilão`,
  ].map((q) => q.slice(0, 120));
}

export function generateQueriesHeuristic(demand: string, searchType: SearchType): string[] {
  const base = extractDemandCore(demand);
  const d = demand.toLowerCase();

  if (/leil[aã]o|detran|tomado|apreendid|financiamento/.test(d)) {
    return auctionQueries(demand);
  }

  const extras: Record<SearchType, string[]> = {
    suppliers: [
      `${base} fornecedor Brasil`,
      `${base} atacado preço`,
      `${base} distribuidor contato`,
    ],
    comparison: [
      `${base} comparativo`,
      `${base} prós e contras`,
      `${base} alternativas open source`,
    ],
    market_research: [
      `${base} preço mercado Brasil`,
      `${base} guia compra`,
      `${base} requisitos`,
    ],
    commercial_proposal: [
      `${base} proposta comercial modelo`,
      `${base} benchmark mercado`,
      `${base} escopo projeto`,
    ],
    app_references: [
      `${base} github open source`,
      `${base} stack tecnologia`,
      `${base} casos de uso`,
    ],
    general: [base, `${base} guia completo`, `${base} Brasil 2025`],
  };
  return [...new Set(extras[searchType].map((q) => q.slice(0, 120)))].slice(0, 4);
}

export async function generateQueriesWithLlm(
  demand: string,
  searchType: SearchType,
  settings: AppSettings
): Promise<string[]> {
  if (!settings.llmApiKey) {
    return generateQueriesHeuristic(demand, searchType);
  }

  const raw = await chatCompletion(settings, [
    {
      role: 'system',
      content:
        'Você gera subconsultas de busca web em português. Responda APENAS com JSON: {"queries":["...","..."]}. Máximo 4 consultas objetivas.',
    },
    {
      role: 'user',
      content: `Demanda: ${demand}\nTipo: ${searchType}\nGere consultas para SearXNG.`,
    },
  ]);

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('sem json');
    const parsed = JSON.parse(match[0]) as { queries?: string[] };
    if (parsed.queries?.length) return parsed.queries.slice(0, 4);
  } catch {
    /* fallback */
  }
  return generateQueriesHeuristic(demand, searchType);
}

const OUTPUT_INSTRUCTIONS: Record<OutputType, string> = {
  summary: 'Entregue um resumo executivo com bullet points e fontes numeradas.',
  comparison: 'Compare opções em tabela markdown e recomendação final.',
  shortlist: 'Liste 3-7 opções ranqueadas com motivo e link.',
  briefing: 'Briefing executivo: contexto, achados, riscos, próximos passos.',
  report: 'Relatório completo estruturado com seções claras.',
  directions: 'Direcionamentos práticos para construir a demanda/produto.',
};

export async function synthesizeReport(params: {
  demand: string;
  searchType: SearchType;
  outputType: OutputType;
  extracts: { url: string; title: string; content: string }[];
  snippets: { url: string; title: string; snippet: string }[];
  settings: AppSettings;
}): Promise<string> {
  const { demand, searchType, outputType, extracts, snippets, settings } = params;

  const sourcesBlock = extracts
    .map(
      (e, i) =>
        `[${i + 1}] ${e.title}\nURL: ${e.url}\nConteúdo:\n${e.content.slice(0, 2500)}`
    )
    .join('\n\n---\n\n');

  const snippetBlock = snippets
    .slice(0, 8)
    .map((s) => `- ${s.title} (${s.url}): ${s.snippet}`)
    .join('\n');

  if (settings.llmApiKey) {
    return chatCompletion(
      settings,
      [
        {
          role: 'system',
          content: `Você é a Cortana, assistente de pesquisa para decisão.
Regras:
- Use SOMENTE as fontes fornecidas abaixo.
- Se faltar dado, diga explicitamente o que faltou.
- Cite fontes como [1], [2] com base nos números fornecidos.
- Responda em português do Brasil.
- ${OUTPUT_INSTRUCTIONS[outputType]}`,
        },
        {
          role: 'user',
          content: `Demanda: ${demand}
Tipo de pesquisa: ${searchType}
Tipo de saída: ${outputType}

SNIPPETS (metadados):
${snippetBlock}

CONTEÚDO EXTRAÍDO:
${sourcesBlock || '(Nenhum conteúdo extraído — use apenas snippets e indique limitação)'}`,
        },
      ],
      0.2
    );
  }

  return buildFallbackReport(demand, outputType, extracts, snippets);
}

function buildFallbackReport(
  demand: string,
  outputType: OutputType,
  extracts: { url: string; title: string; content: string }[],
  snippets: { url: string; title: string; snippet: string }[]
): string {
  const lines = [
    `# Cortana — ${outputType}`,
    '',
    `**Demanda:** ${demand}`,
    '',
    '> Modo offline: configure a IA em Configurações para síntese completa.',
    '',
    '## Fontes analisadas',
    '',
  ];

  if (extracts.length) {
    extracts.forEach((e, i) => {
      lines.push(`### [${i + 1}] ${e.title}`);
      lines.push(`- URL: ${e.url}`);
      lines.push(`- Trecho: ${e.content.slice(0, 400)}...`);
      lines.push('');
    });
  } else {
    snippets.forEach((s, i) => {
      lines.push(`- [${i + 1}] **${s.title}** — ${s.url}`);
      lines.push(`  ${s.snippet}`);
    });
  }

  lines.push('', '## Próximo passo');
  lines.push('Configure `llmApiKey` e rode novamente para síntese inteligente.');
  return lines.join('\n');
}
