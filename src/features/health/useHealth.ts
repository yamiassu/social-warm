import { useQuery } from '@tanstack/react-query'
import { HEALTH_URL, type Health } from './health.model'

// public file on GitHub: no key, no user data sent. Offline or not published yet -> nothing is shown.
export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    staleTime: 30 * 60_000,
    retry: false,
    queryFn: async (): Promise<Health> => {
      const res = await fetch(HEALTH_URL, { cache: 'no-cache' })
      if (!res.ok) throw new Error(`health ${res.status}`)
      return res.json()
    },
  })
