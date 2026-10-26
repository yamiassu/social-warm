import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export type Kind = 'like' | 'reply' | 'follow'
export type Done = { t: number; type: Kind; url: string }

const DAY = 864e5

// rolling 24h window: simple, and what platforms actually rate-limit on
export const usedToday = (h: Done[], type: Kind, now = Date.now()) => h.filter((d) => d.type === type && now - d.t < DAY).length
export const already = (h: Done[], type: Kind, url: string) => h.some((d) => d.type === type && d.url === url)

export const loadHistory = async () => ((await chrome.storage.local.get('history')).history ?? []) as Done[]

export async function record(d: Done) {
  await chrome.storage.local.set({ history: [...(await loadHistory()), d].slice(-2000) })
}

export function useHistory() {
  const qc = useQueryClient()
  useEffect(() => {
    const on = (c: Record<string, unknown>) => { if ('history' in c) void qc.invalidateQueries({ queryKey: ['history'] }) }
    chrome.storage.onChanged.addListener(on)
    return () => chrome.storage.onChanged.removeListener(on)
  }, [qc])
  return useQuery({ queryKey: ['history'], queryFn: loadHistory })
}
