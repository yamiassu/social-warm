import { useMutation } from '@tanstack/react-query'
import { PROVIDERS, isConfigured, type AiCfg, type Provider } from './ai.model'
import { runPrompt } from './ai.client'
import type { AiForm } from './useAiSettings'

export function AiSettingsTab({ form, cfg }: { form: AiForm; cfg: AiCfg }) {
  const test = useMutation({ mutationFn: () => runPrompt(cfg, 'Reply with the single word: ok') })

  const pick = (p: Provider) => {
    form.setFieldValue('provider', p)
    form.setFieldValue('model', PROVIDERS[p].model)
    test.reset()
  }

  return (
    <section className="card">
      <h2>AI model</h2>
      <p className="hint">Optional. Run the generated prompt here instead of copying it to another app.</p>

      <div className="seg" role="radiogroup" aria-label="Provider">
        {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
          <button key={p} role="radio" aria-checked={cfg.provider === p} className={cfg.provider === p ? 'on' : ''} onClick={() => pick(p)}>
            {PROVIDERS[p].label}
          </button>
        ))}
      </div>
      <p className="hint">{PROVIDERS[cfg.provider].hint}</p>

      {cfg.provider !== 'local' && (
        <label className="field">API key
          <form.Field name="apiKey">
            {(f) => <input type="password" autoComplete="off" placeholder={cfg.provider === 'openai' ? 'sk-…' : 'sk-or-…'} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
          </form.Field>
        </label>
      )}
      {cfg.provider === 'local' && (
        <label className="field">Base URL
          <form.Field name="baseURL">
            {(f) => <input value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
          </form.Field>
        </label>
      )}
      <label className="field">Model
        <form.Field name="model">
          {(f) => <input spellCheck={false} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
        </form.Field>
      </label>

      <div className="row">
        <span className="lbl">Send post images <small className="hint">only for models that can see images</small></span>
        <form.Field name="vision">
          {(f) => (
            <label className="sw">
              <input type="checkbox" aria-label="Send post images" checked={f.state.value} onChange={(e) => f.handleChange(e.target.checked)} />
              <i />
            </label>
          )}
        </form.Field>
      </div>

      <button className="primary" disabled={!isConfigured(cfg) || test.isPending} onClick={() => test.mutate()}>
        {test.isPending ? 'Testing…' : 'Test connection'}
      </button>
      {test.isSuccess && <p className="hint ok">Connected — model replied: {test.data.trim().slice(0, 60) || '(empty)'}</p>}
      {test.isError && <p className="hint err">{String(test.error)}</p>}

      <p className="hint">
        Your key is stored in this browser only (not encrypted) and sent only to the provider above.
        {cfg.provider === 'local' && ' For Ollama, start it with OLLAMA_ORIGINS=chrome-extension://* so it accepts this extension.'}
      </p>
    </section>
  )
}
