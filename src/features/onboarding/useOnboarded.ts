import { useQuery, useQueryClient } from '@tanstack/react-query'

// installs that already have saved settings predate the setup phase: don't make them redo it
export const useOnboarded = () =>
  useQuery({
    queryKey: ['onboarded'],
    staleTime: Infinity,
    queryFn: async () => {
      const s = await chrome.storage.local.get(['onboarded', 'cfg'])
      return (s.onboarded as boolean | undefined) ?? !!s.cfg
    },
  })

export function useSetOnboarded() {
  const qc = useQueryClient()
  return (value: boolean) => {
    void chrome.storage.local.set({ onboarded: value })
    qc.setQueryData(['onboarded'], value)
  }
}
