import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CodeEditor } from '../../shared/ui/CodeEditor'
import { Icon } from '../../shared/ui/icons'
import { navigate, sendToPage } from '../../shared/chrome/tabs'
import { already, loadHistory, record, usedToday, useHistory, type Kind } from '../../shared/history'
import { platformById } from '../../platforms/registry'
import type { Entry } from './apply.model'
import { isTextError, parseResponse, replyProblem } from './apply.parse'
import { buildErrorReport, gapMs, pause } from './apply.run'

type Props = { tabId?: number; supported: boolean; incoming?: { text: string; n: number }; caps: Record<Kind, number>; banned: string[] }

export function ApplyTab({ tabId, supported, incoming, caps, banned }: Props) {
  const [raw, setRaw] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [dry, setDry] = useState(true)
  const [copied, setCopied] = useState(false)
  const [stopped, setStopped] = useState('')
  const halt = useRef(false)
  const history = useHistory()

  const patch = (id: string, p: Partial<Entry>) => setEntries((es) => es.map((e) => (e.id === id ? { ...e, ...p } : e)))
  const todo = entries.filter((e) => !e.error && e.do)
  const problems = entries.filter((e) => e.error || e.status === 'failed')

  const load = (text: string) => {
    const r = parseResponse(text, banned)
    setEntries(r.entries); setError(r.error ?? ''); setStopped('')
  }

  // a response handed over by another feature (e.g. a model run): load and validate it
  useEffect(() => { if (incoming) { setRaw(incoming.text); load(incoming.text) } }, [incoming]) // eslint-disable-line react-hooks/exhaustive-deps

  // review: edit a reply or skip/keep any action before applying; text rules re-run on every change
  const review = (e: Entry, p: Partial<Entry>) => {
    const n = { ...e, ...p }
    const textual = n.ref?.type === 'reply' && n.do
    const err = isTextError(e.error) || !e.error ? (textual ? replyProblem(n.text, platformById(n.ref!.platform).replyMax, banned) : undefined) : e.error
    patch(e.id, { ...p, error: err, status: n.do ? 'pending' : 'skipped' })
  }

  const run = async () => {
    setRunning(true); halt.current = false; setStopped('')
    setEntries((es) => es.map((e) => (e.error || !e.do ? e : { ...e, status: 'pending', detail: undefined })))
    const hist = await loadHistory()
    for (const e of todo) {
      if (halt.current) break
      const { type, url } = e.ref!
      if (already(hist, type, url)) { patch(e.id, { status: 'skipped', detail: 'already done earlier' }); continue }
      if (usedToday(hist, type, Date.now()) >= caps[type]) { patch(e.id, { status: 'skipped', detail: `daily ${type} cap (${caps[type]}) reached` }); continue }
      patch(e.id, { status: 'running' })
      let walled = false
      try {
        await navigate(tabId!, url)
        const r = await sendToPage(tabId!, { type: 'act', action: { type, text: e.text, dry } })
        patch(e.id, { status: r?.status ?? 'failed', detail: r?.detail ?? (r ? undefined : 'no response from page'), pageUrl: r?.url })
        if (r?.status === 'done' && !dry) { const d = { t: Date.now(), type, url }; hist.push(d); await record(d) }
        walled = /^blocked/.test(r?.detail ?? '')
      } catch (err) {
        patch(e.id, { status: 'failed', detail: String(err) })
      }
      if (walled) { setStopped('The site is showing a challenge or rate limit. Stopped; check the account in the tab before continuing.'); break }
      if (!dry) { const ms = gapMs(); for (let i = 0; i < ms / 400 && !halt.current; i++) await pause(400) }
    }
    setRunning(false)
  }

  const copyReport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(buildErrorReport({ entries, error, raw, dry }), null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const used = (k: Kind) => `${usedToday(history.data ?? [], k)}/${caps[k]}`

  return (
    <>
      <section className="card">
        <h2>Paste response</h2>
        <CodeEditor lang={raw.trimStart().startsWith('{') ? 'json' : 'markdown'} rows={8} placeholder={'{ "version": 1, "actions": [ … ] }'} value={raw} onChange={setRaw} />
        <button className="primary" disabled={!raw.trim() || running} onClick={() => load(raw)}>Validate</button>
        {error && <p className="hint err">{error}</p>}
      </section>

      {entries.length > 0 && (
        <section className="card">
          <h2>Actions <span>{todo.length} valid to apply</span></h2>
          <ul className="acts">
            {entries.map((e, i) => {
              const editable = !running && e.ref?.type === 'reply' && e.do && (!e.error || isTextError(e.error))
              return (
                <li key={e.id} className={e.error ? 'bad' : e.status} style={{ '--i': i } as CSSProperties}>
                  <b>{e.ref ? <Icon name={e.ref.type} /> : '?'}</b>
                  <span className="t">
                    {e.id} {e.ref?.label}
                    <small>{e.error ? `ignored: ${e.error}` : e.status === 'skipped' ? `skipped${e.detail ? ': ' + e.detail : e.reason ? ': ' + e.reason : ''}` : e.detail ?? (e.ref?.type === 'reply' ? '' : e.text ?? '')}</small>
                  </span>
                  {e.ref && !running && (!e.error || isTextError(e.error)) && (
                    <button className="linkbtn" onClick={() => review(e, { do: !e.do })}>{e.do ? 'skip' : 'keep'}</button>
                  )}
                  <em>{e.error ? 'invalid' : e.status}</em>
                  {editable && (
                    <textarea className="edit" rows={3} aria-label={`Reply ${e.id}`} value={e.text ?? ''} onChange={(ev) => review(e, { text: ev.target.value })} />
                  )}
                </li>
              )
            })}
          </ul>
          <p className="hint">Today (24h): {used('like')} likes · {used('reply')} replies · {used('follow')} follows</p>
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
          {stopped && <p className="hint err">{stopped}</p>}
          {!dry && <p className="hint">Opens each post/profile in the current tab with human-like pauses (8–22s apart, with the odd longer break). Replies above are editable.</p>}
        </section>
      )}

      {(problems.length > 0 || error) && (
        <button className="primary stop" onClick={copyReport}>{copied ? 'Copied ✓' : `Copy error report (${problems.length + (error ? 1 : 0)})`}</button>
      )}
    </>
  )
}
