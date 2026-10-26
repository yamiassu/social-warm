export const KEYS = ['likes', 'comments', 'follows'] as const
export type Key = (typeof KEYS)[number]
export type Cfg = { base: string; niche: string } & Record<Key, { on: boolean; n: number }>

export const LABELS: Record<Key, string> = {
  likes: 'Likes / reactions',
  comments: 'Comments / replies',
  follows: 'Follows',
}

export const DEFAULTS: Cfg = {
  niche: '',
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

// disabled categories count as zero
export const targetsOf = (cfg: Cfg) =>
  Object.fromEntries(KEYS.map((k) => [k, cfg[k].on ? cfg[k].n : 0])) as Record<Key, number>
