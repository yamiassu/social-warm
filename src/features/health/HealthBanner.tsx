import { platformById, type PlatformId } from '../../platforms/registry'
import { ISSUES_URL, describe } from './health.model'
import { useHealth } from './useHealth'

// only speaks up when the current site's last check failed, so it never nags while things work
export function HealthBanner({ platform }: { platform?: PlatformId }) {
  const { data } = useHealth()
  const site = platform && data?.sites[platform]
  if (!platform || !site || site.status !== 'failed') return null
  return (
    <div className="banner" role="status">
      <b>{platformById(platform).label} gathering may be broken.</b> {describe(site).text}. The site probably changed;
      {' '}<a href={ISSUES_URL} target="_blank" rel="noreferrer">see the status</a>.
    </div>
  )
}
