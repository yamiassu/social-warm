import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, useStore } from '@tanstack/react-form'
import { DEFAULTS, type Cfg } from './settings.model'

export const useSavedSettings = () =>
  useQuery({
    queryKey: ['cfg'],
    staleTime: Infinity,
    queryFn: async () => ({ ...DEFAULTS, ...((await chrome.storage.local.get('cfg')).cfg as Partial<Cfg> | undefined) }) as Cfg,
  })

// form state + persistence of the base prompt and gather counts
export function useSettings(initial: Cfg) {
  const form = useForm({ defaultValues: initial })
  const cfg = useStore(form.store, (s) => s.values)
  useEffect(() => { void chrome.storage.local.set({ cfg }) }, [cfg])
  return { form, cfg }
}

export type SettingsForm = ReturnType<typeof useSettings>['form']
