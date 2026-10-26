import { useState, type CSSProperties } from 'react'
import { OnboardingFlow } from '../features/onboarding/OnboardingFlow'
import { useOnboarded, useSetOnboarded } from '../features/onboarding/useOnboarded'
import { AiRunButton } from '../features/ai/AiRunButton'
import { AiSettingsTab } from '../features/ai/AiSettingsTab'
import { useAiSettings, useSavedAi } from '../features/ai/useAiSettings'
import type { AiCfg } from '../features/ai/ai.model'
import { ApplyTab } from '../features/apply/ApplyTab'
import { GatherTab } from '../features/gather/GatherTab'
import { useSavedGather } from '../features/gather/useSavedGather'
import { useSavedSettings, useSettings } from '../features/settings/useSettings'
import type { Cfg } from '../features/settings/settings.model'
import type { Saved } from '../features/gather/gather.model'
import { Icon } from '../shared/ui/icons'
import { platformOf, SUPPORTED_LABELS } from '../platforms/registry'
import { useActiveTab } from '../shared/chrome/tabs'
import logo from '../../assets/icon.svg'

const TABS = { gather: 'Gather', apply: 'Apply' } as const
type View = keyof typeof TABS

export function App() {
  const tab = useActiveTab()
  const settings = useSavedSettings()
  const saved = useSavedGather()
  const ai = useSavedAi()
  const onboarded = useOnboarded()
  if (!settings.data || !saved.data || !ai.data || onboarded.data === undefined) return null
  return <Shell initial={settings.data} initialAi={ai.data} onboarded={onboarded.data} saved={saved.data} tabId={tab.data?.id} platform={platformOf(tab.data?.url)?.label} />
}

type ShellProps = { initial: Cfg; initialAi: AiCfg; onboarded: boolean; saved: Saved; tabId?: number; platform?: string }

function Shell({ initial, initialAi, onboarded, saved, tabId, platform }: ShellProps) {
  const setOnboarded = useSetOnboarded()
  const supported = !!platform
  const [view, setView] = useState<View>('gather')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [incoming, setIncoming] = useState<{ text: string; n: number }>()
  const { form, cfg } = useSettings(initial)
  const ai = useAiSettings(initialAi)

  return (
    <div className="app">
      <header>
        <img className="logo" src={logo} alt="" />
        <div><h1>Social Warm-Up</h1><p>Warm up before you post.</p></div>
        <span className={'pill ' + (supported ? 'ok' : 'bad')}>{platform ? `${platform} detected` : 'Unsupported'}</span>
        {onboarded && <button className={'iconbtn' + (settingsOpen ? ' on' : '')} aria-label={settingsOpen ? 'Close settings' : 'Open settings'} title={settingsOpen ? 'Close settings' : 'AI settings'} onClick={() => setSettingsOpen((o) => !o)}>
          <Icon name={settingsOpen ? 'close' : 'settings'} />
        </button>}
      </header>
      {!onboarded ? (
        <OnboardingFlow form={form} cfg={cfg} aiStep={<AiSettingsTab form={ai.form} cfg={ai.cfg} />} onDone={() => setOnboarded(true)} />
      ) : (<>
      <nav className="tabs" hidden={settingsOpen} style={{ '--tab': view === 'gather' ? 0 : 1 } as CSSProperties}>
        {(Object.keys(TABS) as View[]).map((v) => (
          <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{TABS[v]}</button>
        ))}
      </nav>
      {/* all tabs stay mounted so in-progress state survives tab switches */}
      <main hidden={settingsOpen || view !== 'gather'}>
        <GatherTab
          form={form} cfg={cfg} saved={saved} tabId={tabId} supported={supported}
          resultActions={(prompt) => (
            <AiRunButton
              prompt={prompt} cfg={ai.cfg}
              onOpenSettings={() => setSettingsOpen(true)}
              onResponse={(text) => { setIncoming((p) => ({ text, n: (p?.n ?? 0) + 1 })); setView('apply') }}
            />
          )}
        />
      </main>
      <main hidden={settingsOpen || view !== 'apply'}>
        <ApplyTab tabId={tabId} supported={supported} incoming={incoming} />
      </main>
      <main hidden={!settingsOpen}>
        <AiSettingsTab form={ai.form} cfg={ai.cfg} />
        <button className="primary stop" onClick={() => { setSettingsOpen(false); setOnboarded(false) }}>Run setup again</button>
      </main>
      </>)}
    </div>
  )
}
