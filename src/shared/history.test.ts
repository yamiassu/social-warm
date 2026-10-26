import { describe, expect, it } from 'vitest'
import { already, usedToday, type Done } from './history'

const now = 1_000_000_000_000
const h: Done[] = [
  { t: now - 1000, type: 'like', url: 'a' },
  { t: now - 3_600_000, type: 'like', url: 'b' },
  { t: now - 90_000_000, type: 'like', url: 'old' }, // > 24h ago
  { t: now - 1000, type: 'reply', url: 'a' },
]

describe('history', () => {
  it('counts a rolling 24h window per kind', () => {
    expect(usedToday(h, 'like', now)).toBe(2)
    expect(usedToday(h, 'reply', now)).toBe(1)
    expect(usedToday(h, 'follow', now)).toBe(0)
  })
  it('remembers what was done to a url, per kind, forever', () => {
    expect(already(h, 'like', 'old')).toBe(true)
    expect(already(h, 'follow', 'a')).toBe(false)
  })
})
