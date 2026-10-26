// Merge the per-site probe reports into the public health files (run by the `publish` job of scraper-health.yml).
// Reads results/probe-<site>/<site>.json, writes health-out/status.json (what the extension reads)
// and health-out/<site>.json (shields.io endpoint badges for the README).
import fs from 'node:fs'
import { PROBES } from './probes.mjs'

const LABELS = { x: 'X', reddit: 'Reddit', linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube' }
const BADGE = {
  passed: ['passing', 'brightgreen'],
  failed: ['failing', 'red'],
  blocked: ['blocked in CI', 'yellow'],
  skipped: ['not monitored', 'lightgrey'],
  error: ['no report', 'orange'],
}

const run = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : undefined
const now = new Date().toISOString()
const sites = {}
fs.mkdirSync('health-out', { recursive: true })

for (const id of Object.keys(PROBES)) {
  let report
  try { report = JSON.parse(fs.readFileSync(`results/probe-${id}/${id}.json`, 'utf8')) } catch { /* job died before writing */ }
  const status = report?.status && BADGE[report.status] ? report.status : 'error'
  sites[id] = { status, when: report?.when || now }
  const [message, color] = BADGE[status]
  fs.writeFileSync(`health-out/${id}.json`, JSON.stringify({ schemaVersion: 1, label: LABELS[id], message, color }))
}

fs.writeFileSync('health-out/status.json', JSON.stringify({ updated: now, run, sites }, null, 2))
console.log(JSON.stringify(sites, null, 2))
