import { useState, type ReactNode } from 'react'
import type { Cfg } from '../settings/settings.model'
import type { SettingsForm } from '../settings/useSettings'
import { NICHES, TONES, guideFor, parseNiches, type Tone } from './onboarding.guide'

type Props = {
  form: SettingsForm
  cfg: Cfg
  aiStep: ReactNode // the AI settings card, wired by the app shell
  onDone: () => void
}

const STEPS = ['Niches', 'Guide', 'AI']

export function OnboardingFlow({ form, cfg, aiStep, onDone }: Props) {
  const [step, setStep] = useState(0)
  const [niches, setNiches] = useState(() => parseNiches(cfg.niche))
  const [custom, setCustom] = useState('')
  const [tone, setTone] = useState<Tone>('friendly')
  const [guide, setGuide] = useState(cfg.base)
  const [edited, setEdited] = useState(false)

  const toggle = (n: string) => setNiches((ns) => (ns.includes(n) ? ns.filter((x) => x !== n) : [...ns, n]))
  const addCustom = () => {
    const n = custom.trim().replace(/,/g, ' ')
    if (n && !niches.some((x) => x.toLowerCase() === n.toLowerCase())) setNiches((ns) => [...ns, n])
    setCustom('')
  }
  const chips = [...NICHES, ...niches.filter((n) => !NICHES.includes(n))] // presets first, then the user's own

  const next = () => {
    if (step === 0 && !edited) setGuide(guideFor(niches, tone)) // suggestion until the user edits it
    setStep(step + 1)
  }
  const finish = () => {
    form.setFieldValue('niche', niches.join(', '))
    form.setFieldValue('base', guide)
    onDone()
  }

  return (
    <main>
      <ol className="steps" aria-label="Setup progress">
        {STEPS.map((s, i) => <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}><i>{i + 1}</i>{s}</li>)}
      </ol>

      {step === 0 && (
        <section className="card">
          <h2>Welcome</h2>
          <p className="hint">What do you post about? Pick as many niches as you like; they shape who you engage with.</p>
          <div className="chips">
            {chips.map((n) => (
              <button key={n} aria-pressed={niches.includes(n)} className={'chip' + (niches.includes(n) ? ' on' : '')} onClick={() => toggle(n)}>{n}</button>
            ))}
          </div>
          <label className="field">Add your own
            <div className="adder">
              <input placeholder="e.g. Rust, music production" value={custom} onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} />
              <button className="primary stop" disabled={!custom.trim()} onClick={addCustom}>Add</button>
            </div>
          </label>
          <h2>Voice</h2>
          <div className="seg" role="radiogroup" aria-label="Voice">
            {(Object.keys(TONES) as Tone[]).map((t) => (
              <button key={t} role="radio" aria-checked={tone === t} className={tone === t ? 'on' : ''} onClick={() => setTone(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="card">
          <h2>Guide prompt</h2>
          <p className="hint">Your standing instructions for the AI. Edit freely; you can change it any time in the Gather tab.</p>
          <textarea rows={12} spellCheck={false} value={guide} onChange={(e) => { setGuide(e.target.value); setEdited(true) }} />
          <button className="primary stop" onClick={() => { setGuide(guideFor(niches, tone)); setEdited(false) }}>Reset to suggestion</button>
        </section>
      )}

      {step === 2 && (
        <>
          {aiStep}
          <p className="hint">Optional. Skip it to copy prompts into your own AI app instead; you can add a model later from the cog.</p>
        </>
      )}

      <div className="btns">
        {step > 0 && <button className="primary stop" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 2
          ? <button className="primary" disabled={step === 0 ? !niches.length : !guide.trim()} onClick={next}>Next</button>
          : <button className="primary" onClick={finish}>Finish setup</button>}
      </div>
      {step === 2 && <button className="linkbtn" onClick={finish}>Skip AI for now</button>}
    </main>
  )
}
