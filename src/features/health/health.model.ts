import type { PlatformId } from '../../platforms/registry'

// published by the scraper-health workflow to the `health` branch
export const REPO = 'yamiassu/social-warm'
export const HEALTH_URL = `https://raw.githubusercontent.com/${REPO}/health/status.json`
export const ISSUES_URL = `https://github.com/${REPO}/issues?q=is%3Aopen+label%3Ascraper-health`
export const WORKFLOW_URL = `https://github.com/${REPO}/actions/workflows/scraper-health.yml`

export type HealthStatus = 'passed' | 'failed' | 'blocked' | 'skipped' | 'error'
export type SiteHealth = { status: HealthStatus; when?: string }
export type Health = { updated: string; run?: string; sites: Partial<Record<PlatformId, SiteHealth>> }

const DAY = 86_400_000
export const STALE_DAYS = 7

export function ago(iso?: string) {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}
export const isStale = (iso?: string) => !!iso && Date.now() - new Date(iso).getTime() > STALE_DAYS * DAY

// what a user should read for a site, and how worried to look
export function describe(h?: SiteHealth): { tone: 'ok' | 'warn' | 'bad' | 'mute'; text: string } {
  if (!h) return { tone: 'mute', text: 'No data yet' }
  switch (h.status) {
    case 'passed': return isStale(h.when) ? { tone: 'warn', text: `Last verified ${ago(h.when)}` } : { tone: 'ok', text: `Working · verified ${ago(h.when)}` }
    case 'failed': return { tone: 'bad', text: `Gathering broken · checked ${ago(h.when)}` }
    case 'blocked': return { tone: 'mute', text: 'Can’t be verified automatically' }
    case 'skipped': return { tone: 'mute', text: 'Not monitored' }
    default: return { tone: 'warn', text: 'Last check had no report' }
  }
}
