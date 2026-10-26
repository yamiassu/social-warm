import { platformById, platformByPostUrl, type PlatformId } from '../../platforms/registry'
import type { Entry, Ref } from './apply.model'

// the response is self-contained (url / handle per action), so no prior gather is needed
function toRef(a: any, platformId: PlatformId): Ref | string {
  if (a?.type === 'follow') {
    const p = platformById(platformId)
    const h = String(a.handle ?? '').replace(/^@/, '')
    return p.handle.test(h) ? { type: 'follow', url: p.profile(h), label: '@' + h, platform: p.id } : 'invalid handle'
  }
  if (a?.type === 'like' || a?.type === 'reply') {
    const url = String(a.url ?? '')
    const p = platformByPostUrl(url)
    const m = p && url.match(p.post)
    return p && m ? { type: a.type, url: m[0], label: new URL(m[0]).pathname.slice(0, 40), platform: p.id } : 'invalid post url'
  }
  return 'unknown type'
}

// reply text rules; also re-run when the user edits a reply before applying
export function replyProblem(text: unknown, max: number, banned: string[] = []): string | undefined {
  if (!(typeof text === 'string' && text.trim() && text.length <= max && !/https?:\/\/|#\w/.test(text)))
    return `reply text missing, over ${max} chars, or has link/hashtag`
  const hit = banned.find((b) => text.toLowerCase().includes(b.toLowerCase()))
  return hit ? `reply contains banned phrase "${hit}"` : undefined
}
export const isTextError = (e?: string) => !!e?.startsWith('reply ')

export function parseResponse(raw: string, banned: string[] = []): { entries: Entry[]; error?: string } {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
  let j: any
  try { j = JSON.parse(body) } catch (e) { return { entries: [], error: `No valid JSON found (${e}).` } }
  if (j?.version !== 1 || !Array.isArray(j.actions)) return { entries: [], error: 'Expected {"version":1,"actions":[…]}.' }
  const platformId: PlatformId = j.platform ?? 'x' // follows have no url, so the document says which site
  const seen = new Set<string>()
  const entries = j.actions.map((a: any, i: number): Entry => {
    const id = typeof a?.id === 'string' && a.id ? a.id : `#${i + 1}`
    const r = toRef(a, platformId)
    const ref = typeof r === 'string' ? undefined : r
    const e: Entry = { id, ref, do: a?.do, text: a?.text, reason: a?.reason, status: 'pending' }
    const max = ref ? platformById(ref.platform).replyMax : 280
    if (!ref) e.error = r as string
    else if (seen.has(id)) e.error = 'duplicate id'
    else if (typeof a.do !== 'boolean') e.error = '"do" must be true/false'
    else if (ref.type === 'reply' && a.do) e.error = replyProblem(a.text, max, banned)
    seen.add(id)
    if (!e.error && !a.do) e.status = 'skipped'
    return e
  })
  return { entries }
}
