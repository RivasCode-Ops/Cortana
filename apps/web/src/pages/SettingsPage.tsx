import { useEffect, useState } from 'react';
import { cortanaApi, OUTPUT_LABELS, type AppSettings, type OutputType } from '../api';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [health, setHealth] = useState<{ searxng: boolean; llmConfigured: boolean } | null>(null);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    cortanaApi.getSettings().then(setSettings);
    cortanaApi.settingsHealth().then(setHealth);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const payload: Partial<AppSettings> = { ...settings };
    if (apiKey) payload.llmApiKey = apiKey;
    const s = await cortanaApi.saveSettings(payload);
    setSettings(s);
    setSaved(true);
    setApiKey('');
    cortanaApi.settingsHealth().then(setHealth);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) return <p className="muted">Carregando...</p>;

  return (
    <>
      <h1>Configurações</h1>
      {health && (
        <div className="card">
          SearXNG: <strong>{health.searxng ? 'OK' : 'Offline'}</strong> · IA:{' '}
          <strong>{health.llmConfigured ? 'OK' : 'Não configurada'}</strong>
        </div>
      )}

      <form className="card" onSubmit={save}>
        <div className="grid-2">
          <label>
            URL SearXNG
            <input
              value={settings.searxngUrl}
              onChange={(e) => setSettings({ ...settings, searxngUrl: e.target.value })}
            />
          </label>
          <label>
            Modelo IA
            <input
              value={settings.llmModel}
              onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
            />
          </label>
          <label>
            Base URL IA (OpenAI-compatible)
            <input
              value={settings.llmBaseUrl}
              onChange={(e) => setSettings({ ...settings, llmBaseUrl: e.target.value })}
            />
          </label>
          <label>
            Chave API IA {settings.llmApiKey === '***configured***' && '(já configurada)'}
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </label>
          <label>
            Máx. resultados SearXNG
            <input
              type="number"
              value={settings.maxResults}
              onChange={(e) =>
                setSettings({ ...settings, maxResults: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Máx. páginas extraídas
            <input
              type="number"
              value={settings.maxExtracts}
              onChange={(e) =>
                setSettings({ ...settings, maxExtracts: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Saída padrão
            <select
              value={settings.defaultOutputType}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultOutputType: e.target.value as OutputType,
                })
              }
            >
              {(Object.keys(OUTPUT_LABELS) as OutputType[]).map((k) => (
                <option key={k} value={k}>
                  {OUTPUT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" style={{ marginTop: '1rem' }}>
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </form>
    </>
  );
}
