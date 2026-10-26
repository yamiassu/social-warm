// Save a logged-in session for the scraper-health check.
// Usage: node scripts/auth.mjs <x|linkedin|instagram>
// Opens a real browser; log in, then press Enter here. Prints the command that stores the session as a GitHub secret.
// Use a throwaway/test account: the session is a credential and CI runs from datacenter IPs.
import fs from 'node:fs'
import readline from 'node:readline/promises'
import { chromium } from 'playwright'
import { PROBES, USER_AGENT } from './probes.mjs'

const id = process.argv[2]
const probe = PROBES[id]
if (!probe?.secret) { console.error(`usage: node scripts/auth.mjs <${Object.keys(PROBES).filter((k) => PROBES[k].secret).join('|')}>`); process.exit(2) }

const browser = await chromium.launch({ headless: false, channel: process.env.PROBE_CHANNEL || 'chrome' })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US', userAgent: USER_AGENT })
const page = await context.newPage()
await page.goto(probe.url)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
await rl.question(`Log in to ${id} in the opened browser, then press Enter here… `)
rl.close()

fs.mkdirSync('.auth', { recursive: true })
await context.storageState({ path: `.auth/${id}.json` })
await browser.close()
console.log(`\nSaved .auth/${id}.json (gitignored). Store it as a secret:\n\n  gh secret set ${probe.secret} < .auth/${id}.json\n`)
