import { useMutation } from '@tanstack/react-query'
import { isConfigured, type AiCfg } from './ai.model'
import { runPrompt } from './ai.client'

type Props = { prompt: string; cfg: AiCfg; onResponse: (text: string) => void; onOpenSettings: () => void }

// runs the prompt with the configured model and hands the reply over; otherwise leads to the settings
export function AiRunButton({ prompt, cfg, onResponse, onOpenSettings }: Props) {
  const run = useMutation({ mutationFn: () => runPrompt(cfg, prompt), onSuccess: onResponse })

  if (!isConfigured(cfg)) return <button className="primary stop" onClick={onOpenSettings}>Set up AI to run it</button>
  return (
    <>
      <button className="primary" disabled={run.isPending || !prompt.trim()} onClick={() => run.mutate()}>
        {run.isPending ? 'Waiting for the model…' : 'Run with AI'}
      </button>
      {run.isError && <p className="hint err">{String(run.error)}</p>}
    </>
  )
}
