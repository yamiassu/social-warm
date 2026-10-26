import type { Entry } from './apply.model'

export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

// 8–22s between actions, with an occasional 30–60s breather like a distracted human
export const gapMs = () => 8000 + Math.random() * 14000 + (Math.random() < 0.1 ? 30000 + Math.random() * 30000 : 0)

export const buildErrorReport = (p: { entries: Entry[]; error: string; raw: string; dry: boolean }) => ({
  tool: 'social-warm',
  version: chrome.runtime.getManifest().version,
  when: new Date().toISOString(),
  dryRun: p.dry,
  userAgent: navigator.userAgent,
  parseError: p.error || undefined,
  problems: p.entries
    .filter((e) => e.error || e.status === 'failed')
    .map((e) => ({ id: e.id, type: e.ref?.type, target: e.ref?.url, error: e.error, status: e.status, detail: e.detail, pageUrl: e.pageUrl })),
  input: p.raw.slice(0, 6000),
})
