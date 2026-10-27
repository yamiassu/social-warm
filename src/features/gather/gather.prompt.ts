import { platformById } from '../../platforms/registry'
import type { Key } from '../settings/settings.model'
import type { Result } from './gather.model'

// The prompt is itself a JSON document: sections can be added, removed or enriched
// (by us or by our own AI step) without touching a text template.
const responseFormat = (platform: string, replyMax: number, banned: string[], niche: string, limits?: Record<Key, number>) => ({
  instructions: 'Reply with ONE fenced ```json block and nothing else, shaped exactly like `example`.',
  example: {
    version: 1,
    platform,
    actions: [
      { id: 'L1', type: 'like', do: true, url: '<post url exactly as listed>' },
      { id: 'R1', type: 'reply', do: true, url: '<post url exactly as listed>', text: `your reply, max ${replyMax} chars` },
      { id: 'F1', type: 'follow', do: false, handle: '<handle exactly as listed>', reason: 'why it was skipped' },
    ],
  },
  rules: [
    'Every "id" must be one listed in this document (L = like, R = reply, F = follow) and "type" must match its letter (like / reply / follow). Never invent ids, urls or handles.',
    'Copy "url" (like, reply) or "handle" (follow) exactly from this document; the response must stand on its own.',
    'Include every listed id exactly once. Set "do": false with a short "reason" to skip an item (off-topic, spam, controversial, low quality).',
    '"text" is required only for replies with "do": true: plain text, no hashtags, no links. It must not repeat or closely paraphrase any entry in that post\'s "existing_replies", nor another reply of yours.',
    // the lists are oversampled, so many items are off-niche
    `Items were collected broadly and many may be outside my niche${niche.trim() ? ` (${niche.trim()})` : ''}: set "do": false for those.`,
    ...(limits ? [`Set "do": true for at most ${limits.likes} likes, ${limits.comments} replies and ${limits.follows} follows, choosing the best in-niche ones. Extra "do": true entries are ignored.`] : []),
    ...(banned.length ? [`Replies must never contain these words or phrases (case-insensitive): ${banned.join(', ')}. Entries that do are ignored.`] : []),
    'Items with "images" include picture URLs; if you can see images, use them to judge the post, otherwise rely on the text.',
    'Entries that break these rules will be ignored when applied.',
  ],
})

export function buildPromptDoc(base: string, { platform, page, data }: Result, banned: string[] = [], niche = '', limits?: Record<Key, number>) {
  const p = platformById(platform)
  const images = (x: { images?: string[] }) => (x.images?.length ? { images: x.images } : {})
  return {
    version: 1,
    instructions: base.trim(),
    platform: p.id,
    vocabulary: p.vocabulary, // what like / reply / follow mean on this site
    page,
    likes: data.likes.map((x, i) => ({ id: `L${i + 1}`, url: x.url, author: x.handle, text: x.text, ...images(x) })),
    replies: data.comments.map((x, i) => ({
      id: `R${i + 1}`, url: x.url, author: x.handle, text: x.text,
      stats: { replies: x.replies, likes: x.likes },
      ...images(x),
      existing_replies: (x.thread ?? []).map((r) => ({ author: r.handle, text: r.text })),
    })),
    follows: data.follows.map((x, i) => ({ id: `F${i + 1}`, handle: x.handle, url: p.profile(x.handle), ...(x.bio ? { bio: x.bio } : {}) })),
    response_format: responseFormat(p.id, p.replyMax, banned, niche, limits),
  }
}

export const buildPrompt = (...a: Parameters<typeof buildPromptDoc>) => JSON.stringify(buildPromptDoc(...a), null, 2)
