import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CodeEditor } from '../../shared/ui/CodeEditor'
import { SUPPORTED_LABELS } from '../../platforms/registry'
import { navigate, sendToPage } from '../../shared/chrome/tabs'
import { SettingsCards } from '../settings/SettingsCards'
import { KEYS, phrases, targetsOf, type Cfg } from '../settings/settings.model'
import type { SettingsForm } from '../settings/useSettings'
import { buildPrompt } from './gather.prompt'
import type { Progress, Result, Saved } from './gather.model'

type Props = {
  form: SettingsForm; cfg: Cfg; saved: Saved; tabId?: number; supported: boolean
  resultActions?: (prompt: string) => ReactNode // slot for what to do with the prompt (wired by the app shell)
}

export function GatherTab({ form, cfg, saved, tabId, supported, resultActions }: Props) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<Progress>()
  const [result, setResult] = useState<Result | undefined>(saved.result)
  const [prompt, setPrompt] = useState(() =>
    saved.prompt && saved.prompt.at === saved.result?.at ? saved.prompt.text : saved.result ? buildPrompt(cfg.base, saved.result, phrases(cfg.banned)) : '')
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')
  const halt = useRef(false)

  useEffect(() => { if (result) void chrome.storage.local.set({ prompt: { text: prompt, at: result.at } }) }, [prompt, result])

  const targets = targetsOf(cfg)
  const total = Object.values(targets).reduce((a, b) => a + b, 0)

  useEffect(() => {
    const onMsg = (m: any) => {
      if (m.type === 'progress') setProgress(m)
      if (m.type === 'done') void finish(m)
    }
    // open each reply target and read a few existing replies, then return to the original page
    const finish = async (m: Result) => {
      let r = m
      const n = m.data.comments.length
      if (n && tabId) {
        const comments = []
        for (const [i, t] of m.data.comments.entries()) {
          if (halt.current) { comments.push(t); continue }
          setNote(`Reading existing replies ${i + 1}/${n}…`)
          try {
            await navigate(tabId, t.url)
            comments.push({ ...t, thread: (await sendToPage(tabId, { type: 'replies', max: 8 }))?.replies ?? [] })
          } catch { comments.push(t) }
        }
        await navigate(tabId, m.page)
        r = { ...m, data: { ...m.data, comments } }
        void chrome.storage.local.set({ result: r })
      }
      setRunning(false)
      setNote(halt.current || m.stopped ? 'Stopped early — showing what was found.' : 'Done.')
      setResult(r)
      setPrompt(buildPrompt(form.state.values.base, r, phrases(form.state.values.banned)))
    }
    chrome.runtime.onMessage.addListener(onMsg)
    return () => chrome.runtime.onMessage.removeListener(onMsg)
  }, [form, tabId])

  const start = useMutation({
    mutationFn: () => sendToPage(tabId!, { type: 'collect', targets }),
    onMutate: () => { halt.current = false; setRunning(true); setProgress(undefined); setResult(undefined); setNote('Scrolling the page like a human…') },
    onError: (e) => { setRunning(false); setNote(String(e)) },
  })

  const onGo = () => {
    if (running) { halt.current = true; return void sendToPage(tabId!, { type: 'stop' }).catch(() => {}) }
    if (!total) return setNote('Enable at least one category.')
    start.mutate()
  }
  const got = progress ? KEYS.reduce((s, k) => s + Math.min(progress.got[k], targets[k]), 0) : 0

  return (
    <>
      <SettingsCards form={form} />

      <button className={'primary' + (running ? ' stop' : '')} disabled={!running && !supported} onClick={onGo}>
        {running ? 'Stop' : 'Start gathering'}
      </button>
      {running && (
        <div className="prog">
          <div style={{ width: `${(got / (total || 1)) * 100}%` }} />
          <span>{got}/{total} found{progress ? ` · step ${progress.step + 1}` : ''}</span>
        </div>
      )}
      <p className="hint">{supported ? note : `Open ${SUPPORTED_LABELS} in this tab.`}</p>

      {result && (
        <section className="card">
          <h2>Result <span>{result.data.likes.length} likes · {result.data.comments.length} replies · {result.data.follows.length} follows</span></h2>
          <div className="btns">
            <button
              className="primary stop"
              disabled={!prompt.trim()}
              onClick={async () => {
                await navigator.clipboard.writeText(prompt)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? 'Copied ✓' : 'Copy prompt'}
            </button>
            {resultActions?.(prompt)}
          </div>
          <details className="fold">
            <summary>View / edit prompt</summary>
            <CodeEditor lang="json" rows={12} value={prompt} onChange={setPrompt} />
          </details>
        </section>
      )}
    </>
  )
}
