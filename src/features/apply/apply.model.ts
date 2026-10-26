import type { PlatformId } from '../../platforms/registry'

import type { Kind } from '../../shared/history'

export type { Kind }
export type Ref = { type: Kind; url: string; label: string; platform: PlatformId }
export type Status = 'pending' | 'running' | 'done' | 'skipped' | 'failed'
export type Entry = {
  id: string; ref?: Ref; do?: boolean; text?: string; reason?: string
  error?: string; status: Status; detail?: string; pageUrl?: string
}
