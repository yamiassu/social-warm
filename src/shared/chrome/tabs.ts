import { useEffect } from 'react'
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

export function useActiveTab() {
  const qc = useQueryClient()
  useEffect(() => {
    const refresh = () => qc.invalidateQueries({ queryKey: ['tab'] })
    const onUpdated = (_: number, c: { url?: string }) => c.url && refresh()
    chrome.tabs.onActivated.addListener(refresh)
    chrome.tabs.onUpdated.addListener(onUpdated)
    return () => {
      chrome.tabs.onActivated.removeListener(refresh)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [qc])
  return useQuery({
    queryKey: ['tab'],
    queryFn: async () => (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0],
  })
}
