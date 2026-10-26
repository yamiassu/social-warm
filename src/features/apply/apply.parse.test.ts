import { describe, expect, it } from 'vitest'
import { parseResponse, replyProblem } from './apply.parse'

const doc = (actions: unknown[], platform = 'x') => '```json\n' + JSON.stringify({ version: 1, platform, actions }) + '\n```'
const post = 'https://x.com/someone/status/1234567890'

describe('parseResponse', () => {
  it('accepts valid like, reply and follow', () => {
    const { entries, error } = parseResponse(doc([
      { id: 'L1', type: 'like', do: true, url: post },
      { id: 'R1', type: 'reply', do: true, url: post, text: 'Nice breakdown of the tradeoffs.' },
      { id: 'F1', type: 'follow', do: true, handle: '@someone' },
    ]))
    expect(error).toBeUndefined()
    expect(entries.map((e) => e.error)).toEqual([undefined, undefined, undefined])
    expect(entries[2].ref?.url).toContain('someone')
  })

  it('rejects bad json, wrong version and unknown types', () => {
    expect(parseResponse('nope').error).toMatch(/No valid JSON/)
    expect(parseResponse('{"version":2,"actions":[]}').error).toMatch(/Expected/)
    expect(parseResponse(doc([{ id: 'X1', type: 'boost', do: true }])).entries[0].error).toBe('unknown type')
  })

  it('flags invalid urls, handles, duplicate ids and non-boolean do', () => {
    const { entries } = parseResponse(doc([
      { id: 'L1', type: 'like', do: true, url: 'https://evil.example/status/1' },
      { id: 'F1', type: 'follow', do: true, handle: 'not a handle!' },
      { id: 'L2', type: 'like', do: true, url: post },
      { id: 'L2', type: 'like', do: true, url: post },
      { id: 'L3', type: 'like', do: 'yes', url: post },
    ]))
    expect(entries.map((e) => e.error)).toEqual(['invalid post url', 'invalid handle', undefined, 'duplicate id', '"do" must be true/false'])
  })

  it('marks do:false entries as skipped, not errors', () => {
    const e = parseResponse(doc([{ id: 'L1', type: 'like', do: false, url: post, reason: 'off-topic' }])).entries[0]
    expect(e.error).toBeUndefined()
    expect(e.status).toBe('skipped')
  })

  it('applies reply rules and banned phrases', () => {
    const r = (text?: string) => parseResponse(doc([{ id: 'R1', type: 'reply', do: true, url: post, text }]), ['game changer']).entries[0].error
    expect(r(undefined)).toMatch(/missing/)
    expect(r('see https://spam.example')).toMatch(/link\/hashtag/)
    expect(r('love this #tech')).toMatch(/link\/hashtag/)
    expect(r('x'.repeat(281))).toMatch(/over 280/)
    expect(r('This is a GAME CHANGER')).toMatch(/banned phrase "game changer"/)
    expect(r('Curious how this scales.')).toBeUndefined()
  })
})

describe('replyProblem', () => {
  it('passes clean text', () => expect(replyProblem('Solid point.', 200)).toBeUndefined())
})
