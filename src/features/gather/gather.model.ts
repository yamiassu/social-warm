import type { PlatformId } from '../../platforms/registry'
import type { Key } from '../settings/settings.model'

export type Reply = { handle: string; text: string }
export type Tweet = { url: string; handle: string; text: string; likes: number; replies: number; thread?: Reply[]; images?: string[] }
export type Person = { handle: string; bio: string; confirmed: boolean }
export type Result = {
  at?: number
  platform?: PlatformId
  page: string
  stopped: boolean
  data: { likes: Tweet[]; comments: Tweet[]; follows: Person[] }
}
export type Progress = { step: number; got: Record<Key, number> }
export type Saved = { result?: Result; prompt?: { text: string; at?: number } }
