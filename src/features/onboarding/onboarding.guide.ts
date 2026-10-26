export const NICHES = ['3D & web dev', 'Indie game dev', 'SaaS & startups', 'Design & UX', 'AI & ML', 'Photography', 'Fitness', 'Writing']

export const TONES = {
  friendly: 'warm, kind and curious',
  professional: 'professional, concise and insightful',
  witty: 'light and witty, never snarky',
} as const
export type Tone = keyof typeof TONES

export const parseNiches = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

// the starting "guide prompt": the user edits it in the next step
export const guideFor = (niches: string[], tone: Tone) => {
  const many = niches.length > 1
  return `You are helping me warm up my social media account before I post.
${many ? 'My niches' : 'My niche'}: ${niches.join(', ')}.
Voice: ${TONES[tone]}, specific and brief, like a real person in ${many ? 'these communities' : 'this community'}.
- Like posts that are genuinely good or relevant to ${many ? 'my niches' : 'my niche'}.
- For each item under "replies", draft one short reply (max 200 chars) that adds something real: a specific observation, a useful question or a relevant experience. No hashtags, no links, no emoji spam, no self-promotion.
- Follow accounts that share original work in ${many ? 'my niches' : 'my niche'}.
- Skip anything off-topic, controversial, spammy or low quality.
Pace actions randomly with human-like pauses, and stop if anything looks off (rate limits, captchas).`
}
