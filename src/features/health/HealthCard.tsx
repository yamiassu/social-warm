import { PLATFORMS } from '../../platforms/registry'
import { WORKFLOW_URL, ago, describe } from './health.model'
import { useHealth } from './useHealth'

export function HealthCard() {
  const { data, isPending, isError } = useHealth()
  return (
    <section className="card">
      <h2>Site status</h2>
      <p className="hint">An automated test tries gathering on every supported site every two days.</p>
      {isError && <p className="hint">Status isn’t available right now (offline, or not published yet).</p>}
      {isPending && <p className="hint">Loading…</p>}
      {data && (
        <ul className="health">
          {PLATFORMS.map((p) => {
            const d = describe(data.sites[p.id])
            return <li key={p.id}><i className={'dot ' + d.tone} /><span className="t">{p.label}</span><small>{d.text}</small></li>
          })}
        </ul>
      )}
      {data && <p className="hint">Updated {ago(data.updated)} · <a href={WORKFLOW_URL} target="_blank" rel="noreferrer">view runs</a></p>}
    </section>
  )
}
