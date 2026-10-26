import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CodeEditor } from '../../shared/ui/CodeEditor'
import { Icon } from '../../shared/ui/icons'
import { navigate, sendToPage } from '../../shared/chrome/tabs'
import type { Entry } from './apply.model'
import { parseResponse } from './apply.parse'
import { buildErrorReport, pause } from './apply.run'

export function ApplyTab({ tabId, supported, incoming }: { tabId?: number; supported: boolean; incoming?: { text: string; n: number } }) {
  const [raw, setRaw] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [dry, setDry] = useState(true)
  const [copied, setCopied] = useState(false)
  const halt = useRef(false)

  const patch = (id: string, p: Partial<Entry>) => setEntries((es) => es.map((e) => (e.id === id ? { ...e, ...p } : e)))
  const todo = entries.filter((e) => !e.error && e.do)
  const problems = entries.filter((e) => e.error || e.status === 'failed')

  // a response handed over by another feature (e.g. a model run): load and validate it
  useEffect(() => {
    if (!incoming) return
    const r = parseResponse(incoming.text)
    setRaw(incoming.text); setEntries(r.entries); setError(r.error ?? '')
  }, [incoming])

  const validate = () => {
    const r = parseResponse(raw)
    setEntries(r.entries); setError(r.error ?? '')
  }

  const run = async () => {
    setRunning(true); halt.current = false
    setEntries((es) => es.map((e) => (e.error || !e.do ? e : { ...e, status: 'pending', detail: undefined })))
    for (const e of todo) {
      if (halt.current) break
      patch(e.id, { status: 'running' })
      try {
        await navigate(tabId!, e.ref!.url)
        const r = await sendToPage(tabId!, { type: 'act', action: { type: e.ref!.type, text: e.text, dry } })
        patch(e.id, { status: r?.status ?? 'failed', detail: r?.detail ?? (r ? undefined : 'no response from page'), pageUrl: r?.url })
      } catch (err) {
        patch(e.id, { status: 'failed', detail: String(err) })
      }
      if (!dry) for (let i = 0; i < 20 && !halt.current; i++) await pause((8000 + Math.random() * 14000) / 20) // 8–22s between actions
    }
    setRunning(false)
  }

  const copyReport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(buildErrorReport({ entries, error, raw, dry }), null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <section className="card">
        <h2>Paste response</h2>
        <CodeEditor lang={raw.trimStart().startsWith('{') ? 'json' : 'markdown'} rows={8} placeholder={'{ "version": 1, "actions": [ … ] }'} value={raw} onChange={setRaw} />
        <button className="primary" disabled={!raw.trim() || running} onClick={validate}>Validate</button>
        {error && <p className="hint err">{error}</p>}
      </section>

      {entries.length > 0 && (
        <section className="card">
          <h2>Actions <span>{todo.length} valid to apply</span></h2>
          <ul className="acts">
            {entries.map((e, i) => (
              <li key={e.id} className={e.error ? 'bad' : e.status} style={{ '--i': i } as CSSProperties}>
                <b>{e.ref ? <Icon name={e.ref.type} /> : '?'}</b>
                <span className="t">
                  {e.id} {e.ref?.label}
                  <small>{e.error ? `ignored: ${e.error}` : e.status === 'skipped' ? `skipped${e.reason ? ': ' + e.reason : ''}` : e.detail ?? e.text ?? ''}</small>
                </span>
                <em>{e.error ? 'invalid' : e.status}</em>
              </li>
            ))}
          </ul>
          <div className="row">
            <span className="lbl">Dry run <small className="hint">find buttons, click nothing</small></span>
            <label className="sw"><input type="checkbox" checked={dry} disabled={running} onChange={(e) => setDry(e.target.checked)} /><i /></label>
          </div>
          <button
            className={'primary' + (running ? ' stop' : '')}
            disabled={!running && (!supported || !todo.length)}
            onClick={() => (running ? (halt.current = true) : run())}
          >
            {running ? 'Stop' : `${dry ? 'Dry run' : 'Apply'} ${todo.length} action${todo.length === 1 ? '' : 's'}`}
          </button>
          {!dry && <p className="hint">Opens each post/profile in the current tab with human-like pauses (8–22s apart).</p>}
        </section>
      )}

      {(problems.length > 0 || error) && (
        <button className="primary stop" onClick={copyReport}>{copied ? 'Copied ✓' : `Copy error report (${problems.length + (error ? 1 : 0)})`}</button>
      )}
    </>
  )
}
