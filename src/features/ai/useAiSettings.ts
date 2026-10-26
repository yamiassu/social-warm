import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, useStore } from '@tanstack/react-form'
import { DEFAULT_AI, type AiCfg } from './ai.model'

export const useSavedAi = () =>
  useQuery({
    queryKey: ['ai'],
    staleTime: Infinity,
    queryFn: async () => ({ ...DEFAULT_AI, ...((await chrome.storage.local.get('ai')).ai as Partial<AiCfg> | undefined) }) as AiCfg,
  })

export function useAiSettings(initial: AiCfg) {
  const form = useForm({ defaultValues: initial })
  const cfg = useStore(form.store, (s) => s.values)
  useEffect(() => { void chrome.storage.local.set({ ai: cfg }) }, [cfg])
  return { form, cfg }
}

export type AiForm = ReturnType<typeof useAiSettings>['form']
