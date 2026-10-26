import type { Entry } from './apply.model'

export const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
