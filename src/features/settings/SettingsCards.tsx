import type { MouseEvent } from 'react'
import { Icon } from '../../shared/ui/icons'
import { KEYS, LABELS, clamp } from './settings.model'
import type { SettingsForm } from './useSettings'

// ctrl/alt-click moves by 5
const stepOf = (e: MouseEvent) => (e.ctrlKey || e.altKey ? 5 : 1)

export function SettingsCards({ form }: { form: SettingsForm }) {
  return (
    <>
      <section className="card">
        <h2>What to gather</h2>
        {KEYS.map((k) => (
          <div className="row" key={k}>
            <span className="ico"><Icon name={k} /></span>
            <span className="lbl">{LABELS[k]}</span>
            <form.Field name={`${k}.n`}>
              {(f) => (
                <div className="step">
                  <button aria-label={`Fewer ${LABELS[k]}`} title="Ctrl/Alt-click: 5" onClick={(e) => f.handleChange(clamp(f.state.value - stepOf(e)))}>−</button>
                  <input type="number" aria-label={LABELS[k]} value={f.state.value} onChange={(e) => f.handleChange(clamp(+e.target.value))} />
                  <button aria-label={`More ${LABELS[k]}`} title="Ctrl/Alt-click: 5" onClick={(e) => f.handleChange(clamp(f.state.value + stepOf(e)))}>+</button>
                </div>
              )}
            </form.Field>
            <form.Field name={`${k}.on`}>
              {(f) => (
                <label className="sw">
                  <input type="checkbox" aria-label={`Enable ${LABELS[k]}`} checked={f.state.value} onChange={(e) => f.handleChange(e.target.checked)} />
                  <i />
                </label>
              )}
            </form.Field>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Base prompt</h2>
        <form.Field name="base">
          {(f) => <textarea rows={6} spellCheck={false} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />}
        </form.Field>
      </section>
    </>
  )
}
