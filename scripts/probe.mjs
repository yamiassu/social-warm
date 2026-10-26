// Scraper health probe: runs the real content script (dist/content.js) against a live site and checks
// that gathering still finds well-formed posts. Usage: node scripts/probe.mjs <x|reddit|linkedin|instagram|youtube>
// Needs `npm run build` first. Locally you can reuse your Chrome: PROBE_CHANNEL=chrome node scripts/probe.mjs reddit
import fs from 'node:fs'
import { chromium } from 'playwright'
import { PLATFORMS } from '../src/platforms/registry.ts'
import { PROBES, USER_AGENT } from './probes.mjs'

const id = process.argv[2]
const probe = PROBES[id]
const platform = PLATFORMS.find((p) => p.id === id)
if (!probe || !platform) { console.error(`usage: node scripts/probe.mjs <${Object.keys(PROBES).join('|')}>`); process.exit(2) }

const OUT = 'probe-results'
fs.mkdirSync(OUT, { recursive: true })
const report = { platform: id, url: probe.url, when: new Date().toISOString(), status: 'failed', problems: [], notes: [] }
const finish = (status, code = 0) => {
  report.status = status
  fs.writeFileSync(`${OUT}/${id}.json`, JSON.stringify(report, null, 2))
  const md = [`**${id}** — ${status}`, ...report.problems.map((p) => `- ❌ ${p}`), ...report.notes.map((n) => `- ${n}`)].join('\n')
  fs.writeFileSync(`${OUT}/${id}.md`, md)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n\n')
  console.log(md)
  process.exit(code)
}

const stateJson = probe.secret ? process.env[probe.secret] : undefined
if (probe.secret && !stateJson) {
  console.log(`::notice title=${id} skipped::${probe.secret} is not set (this site needs a login; see README → Scraper health)`)
  report.notes.push(`skipped: ${probe.secret} not set`)
  finish('skipped')
}

// the content script talks to chrome.*: capture its listener and what it sends back
const stub = () => {
  window.__sw = { listener: null, done: null, progress: 0 }
  window.chrome = {
    runtime: {
      onMessage: { addListener: (f) => { window.__sw.listener = f } },
      sendMessage: (m) => { if (m.type === 'done') window.__sw.done = m; if (m.type === 'progress') window.__sw.progress = m.step },
    },
    storage: { local: { set() {} } },
  }
}

const browser = await chromium.launch({ headless: true, channel: process.env.PROBE_CHANNEL || undefined, args: ['--disable-blink-features=AutomationControlled'] })
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 }, locale: 'en-US', userAgent: USER_AGENT,
  ...(stateJson ? { storageState: JSON.parse(stateJson) } : {}),
})
await context.addInitScript(stub)
// as an init script (not addScriptTag): sites with Trusted Types, like YouTube, reject injected scripts
await context.addInitScript({ path: 'dist/content.js' })
const page = await context.newPage()

async function load(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(6000) // let the SPA render
}

try {
  await load(probe.url)
  report.notes.push(`landed on ${page.url()}`)

  // like the real gather: scrolls, harvests, picks. Follows are not asserted (they depend on account state).
  const targets = { likes: 3, comments: 2, follows: 0 }
  const done = await page.evaluate(async (t) => {
    window.__sw.listener({ type: 'collect', targets: t }, null, () => {})
    for (const t0 = Date.now(); !window.__sw.done; await new Promise((r) => setTimeout(r, 500))) if (Date.now() - t0 > 170000) return null
    return window.__sw.done
  }, targets)

  if (!done) report.problems.push('gather timed out (3 min) — page never produced enough posts')
  else {
    const posts = [...done.data.likes, ...done.data.comments]
    report.notes.push(`gathered ${done.data.likes.length} likes + ${done.data.comments.length} replies targets`)
    if (posts.length < 3) report.problems.push(`found only ${posts.length} posts (need at least 3)`)
    const bad = posts.filter((p) => !platform.post.test(p.url) || !p.handle || !(p.text || p.images?.length))
    if (bad.length) report.problems.push(`${bad.length} malformed post(s), e.g. ${JSON.stringify(bad[0]).slice(0, 220)}`)
    if (done.platform !== id) report.problems.push(`wrong adapter picked: ${done.platform}`)

    // existing replies on the first reply target (soft check: many sites hide them when logged out)
    const target = done.data.comments[0] || done.data.likes[0]
    if (target && !report.problems.length) {
      await load(target.url)
      const r = await page.evaluate((u) => new Promise((res) => { window.__sw.listener({ type: 'replies', max: 5 }, null, res); setTimeout(() => res(null), 60000) }), null)
      if (!r?.replies?.length) { report.notes.push('⚠️ could not read existing replies'); console.log(`::warning title=${id}::could not read existing replies on ${target.url}`) }
      else report.notes.push(`read ${r.replies.length} existing replies`)
    }
  }
} catch (e) {
  report.problems.push(String(e).slice(0, 300))
}

if (report.problems.length) await page.screenshot({ path: `${OUT}/${id}.png` }).catch(() => {})
await browser.close()
finish(report.problems.length ? 'failed' : 'passed', report.problems.length ? 1 : 0)
