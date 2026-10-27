import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// message the page script; inject it first if the tab was open before install/update
export async function sendToPage(tabId: number, msg: object): Promise<any> {
  try {
    return await chrome.tabs.sendMessage(tabId, msg)
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
    return chrome.tabs.sendMessage(tabId, msg)
  }
}

export function navigate(tabId: number, url: string) {
  return new Promise<void>((done) => {
    const l = (id: number, c: { status?: string }) => {
      if (id === tabId && c.status === 'complete') { chrome.tabs.onUpdated.removeListener(l); setTimeout(done, 1500) }
    }
    chrome.tabs.onUpdated.addListener(l)
    setTimeout(() => { chrome.tabs.onUpdated.removeListener(l); done() }, 20000)
    chrome.tabs.update(tabId, { url })
  })
}

// the panel is bound to one tab (the one it was opened on) so switching tabs never redirects a run;
// rebind() moves it to whatever tab is active now
export function useActiveTab() {
  const qc = useQueryClient()
  const pinned = useRef<number | undefined>(undefined)
  useEffect(() => {
    const refresh = () => qc.invalidateQueries({ queryKey: ['tab'] })
    const onUpdated = (id: number, c: { url?: string; title?: string }) => (c.url || c.title) && (pinned.current === undefined || id === pinned.current) && refresh()
    chrome.tabs.onUpdated.addListener(onUpdated)
    chrome.tabs.onRemoved.addListener(refresh)
    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated)
      chrome.tabs.onRemoved.removeListener(refresh)
    }
  }, [qc])
  const q = useQuery({
    queryKey: ['tab'],
    queryFn: async () => {
      const bound = pinned.current === undefined ? undefined : await chrome.tabs.get(pinned.current).catch(() => undefined) // closed: fall back to active
      const tab = bound ?? (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0]
      pinned.current = tab?.id
      return tab
    },
  })
  const rebind = () => { pinned.current = undefined; return qc.invalidateQueries({ queryKey: ['tab'] }) }
  return { ...q, rebind }
}
