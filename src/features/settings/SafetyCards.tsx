import { useRef } from 'react'
import { usedToday, useHistory, type Kind } from '../../shared/history'
import { DEFAULTS } from './settings.model'
import type { SettingsForm } from './useSettings'

const CAPS: [Kind, string][] = [['like', 'Likes'], ['reply', 'Replies'], ['follow', 'Follows']]
const PICK = ['base', 'niche', 'banned', 'caps', 'likes', 'comments', 'follows'] as const

// daily limits, words replies must avoid, and a settings backup (the AI key is deliberately not exported)
export function SafetyCards({ form }: { form: SettingsForm }) {
  const history = useHistory()
  const file = useRef<HTMLInputElement>(null)

  const exportCfg = () => {
    const v = form.state.values
    const blob = new Blob([JSON.stringify(Object.fromEntries(PICK.map((k) => [k, v[k]])), null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'social-warm-settings.json' })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const importCfg = async (f?: File) => {
    if (!f) return
    try {
      const j = JSON.parse(await f.text())
      if (!j || typeof j !== 'object') throw new Error()
      const picked = Object.fromEntries(PICK.filter((k) => k in j).map((k) => [k, j[k]]))
      form.reset({ ...DEFAULTS, ...form.state.values, ...picked, caps: { ...DEFAULTS.caps, ...picked.caps } })
    } catch { alert('That file is not a Social Warm-Up settings export.') }
    if (file.current) file.current.value = ''
  }

  return (
    <>
      <section className="card">
        <h2>Daily limits</h2>
        <p className="hint">Applying stops at these numbers per rolling 24 hours. Starting low and growing slowly is safest for a new account.</p>
        <div className="caps">
          {CAPS.map(([k, label]) => (
            <form.Field key={k} name={`caps.${k}`}>
              {(f) => (
                <>
                  <span className="lbl">{label} <small className="hint">{usedToday(history.data ?? [], k)} used today</small></span>
                  <input type="number" min={0} aria-label={`${label} per day`} value={f.state.value} onChange={(e) => f.handleChange(Math.max(0, Math.round(+e.target.value) || 0))} />
                </>
              )}
            </form.Field>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Words to avoid</h2>
        <p className="hint">Replies containing these are rejected, and the model is told not to use them. One per line or comma separated.</p>
        <form.Field name="banned">
          {(f) => <textarea rows={3} spellCheck={false} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
        </form.Field>
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="hint">Move your niche, prompt, counts and limits to another machine. The AI key is not included.</p>
        <div className="btns tight">
          <button className="primary" onClick={exportCfg}>Export</button>
          <button className="primary" onClick={() => file.current?.click()}>Import</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void importCfg(e.target.files?.[0])} />
        </div>
      </section>
    </>
  )
}
