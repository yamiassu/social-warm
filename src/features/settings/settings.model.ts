export const KEYS = ['likes', 'comments', 'follows'] as const
export type Key = (typeof KEYS)[number]
import type { Kind } from '../../shared/history'

export type Cfg = { base: string; niche: string; banned: string; oversample: number; langs: string; search: { on: boolean; days: number }; caps: Record<Kind, number> } & Record<Key, { on: boolean; n: number }>

// phrases the replies must avoid, one per line or comma separated
export const phrases = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean)

export const LABELS: Record<Key, string> = {
  likes: 'Likes / reactions',
  comments: 'Comments / replies',
  follows: 'Follows',
}

export const DEFAULTS: Cfg = {
  niche: '',
  banned: 'great post, game changer, delve, unlock, in today\'s world',
  oversample: 5, // gather this many times the requested amount
  langs: '', // e.g. "en, pt"; empty = any language
  search: { on: false, days: 3 }, // search the niche terms (recent posts only) instead of reading the feed
  caps: { like: 100, reply: 20, follow: 30 }, // per rolling 24h, deliberately conservative
  base: `You are helping me warm up my social media account before I post.
Act like a genuine, curious human in my niche: be specific, kind and brief.
- Like the posts listed below.
- For each item under "replies", draft one short reply (max 200 chars) that adds something real. No hashtags, no links, no emoji spam, no self-promotion.
- Follow the accounts listed below.
Pace actions randomly with human-like pauses, and stop if anything looks off (rate limits, captchas).`,
  likes: { on: true, n: 10 },
  comments: { on: true, n: 5 },
  follows: { on: true, n: 5 },
}

export const clamp = (v: number) => Math.max(0, Math.min(50, Math.round(v) || 0))

// language codes to keep ("en, pt-BR" -> [en, pt]); empty = any
export const langsOf = (s: string) => phrases(s).map((l) => l.toLowerCase().split(/[-_]/)[0])

// niche terms joined as an OR query, multi-word terms quoted
export const queryOf = (niche: string) => phrases(niche).map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' OR ')

// disabled categories count as zero
export const targetsOf = (cfg: Cfg) =>
  Object.fromEntries(KEYS.map((k) => [k, cfg[k].on ? cfg[k].n : 0])) as Record<Key, number>
