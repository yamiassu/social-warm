import { useQuery } from '@tanstack/react-query'
import type { Saved } from './gather.model'

export const useSavedGather = () =>
  useQuery({
    queryKey: ['result'],
    staleTime: Infinity,
    queryFn: async () => (await chrome.storage.local.get(['result', 'prompt'])) as Saved,
  })
