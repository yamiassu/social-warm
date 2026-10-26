import { describe, expect, it } from 'vitest'
import { buildPromptDoc } from './gather.prompt'
import type { Result } from './gather.model'

const result = {
  platform: 'x', page: 'https://x.com/home', at: 1,
  data: {
    likes: [{ url: 'https://x.com/a/status/1', handle: 'a', text: 'hi' }],
    comments: [{ url: 'https://x.com/b/status/2', handle: 'b', text: 'yo', replies: 1, likes: 2, thread: [{ handle: 'c', text: 'first' }] }],
    follows: [{ handle: 'd' }],
  },
} as unknown as Result

describe('buildPromptDoc', () => {
  it('numbers items by kind and carries existing replies', () => {
    const d = buildPromptDoc('  base  ', result)
    expect(d.instructions).toBe('base')
    expect(d.likes[0].id).toBe('L1')
    expect(d.replies[0]).toMatchObject({ id: 'R1', existing_replies: [{ author: 'c', text: 'first' }] })
    expect(d.follows[0].id).toBe('F1')
  })
  it('adds a banned-phrases rule only when there are some', () => {
    expect(buildPromptDoc('b', result).response_format.rules.join()).not.toMatch(/never contain/)
    expect(buildPromptDoc('b', result, ['delve']).response_format.rules.join()).toMatch(/never contain.*delve/)
  })
})
