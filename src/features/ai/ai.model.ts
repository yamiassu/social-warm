export type Provider = 'openrouter' | 'openai' | 'local'
export type AiCfg = { provider: Provider; apiKey: string; model: string; baseURL: string; vision: boolean }

export const PROVIDERS: Record<Provider, { label: string; model: string; baseURL: string; hint: string }> = {
  openrouter: { label: 'OpenRouter', model: 'anthropic/claude-sonnet-5.5', baseURL: 'https://openrouter.ai/api/v1', hint: 'One key, hundreds of models (provider/model ids).' },
  openai: { label: 'OpenAI', model: 'gpt-6.1-sol', baseURL: 'https://api.openai.com/v1', hint: 'Your OpenAI API key.' },
  local: { label: 'Local', model: 'llama3.3', baseURL: 'http://localhost:11434/v1', hint: 'Any OpenAI-compatible server: Ollama, LM Studio, vLLM. No key needed.' },
}

export const DEFAULT_AI: AiCfg = { provider: 'openrouter', apiKey: '', model: PROVIDERS.openrouter.model, baseURL: PROVIDERS.local.baseURL, vision: false }

export const baseUrlOf = (c: AiCfg) => (c.provider === 'local' ? c.baseURL.trim() : PROVIDERS[c.provider].baseURL)

export const isConfigured = (c: AiCfg) =>
  !!c.model.trim() && (c.provider === 'local' ? !!c.baseURL.trim() : !!c.apiKey.trim())
