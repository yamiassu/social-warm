// Renders the built side panel with a stubbed `chrome` API and demo data, and saves README screenshots.
// Usage: npm run build && npm run screenshots   (set CHROME_PATH if Chrome isn't in the default spot)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'docs/screenshots'
fs.mkdirSync(OUT, { recursive: true })

// all demo content is fictional
const result = {
  at: 1, platform: 'x', page: 'https://x.com/home', stopped: false,
  data: {
    likes: [
      { url: 'https://x.com/pixelforge/status/1001', handle: 'pixelforge', text: 'Shipped a tiny WebGL particle demo in 40 lines. Source in the thread.', likes: 214, replies: 9, images: [] },
      { url: 'https://x.com/lowpolylena/status/1002', handle: 'lowpolylena', text: 'Baked lighting finally clicked for me today. Before and after below.', likes: 87, replies: 4, images: [] },
      { url: 'https://x.com/indiodev/status/1003', handle: 'indiodev', text: 'Week 12 of my solo game. The menu is finally not ugly.', likes: 52, replies: 6, images: [] },
    ],
    comments: [
      {
        url: 'https://x.com/devnora/status/2001', handle: 'devnora', likes: 340, replies: 28, images: [],
        text: 'Hot take: most side projects die at the boring 80% mark, not at the idea stage. Ship the boring part first.',
        thread: [
          { handle: 'tomasbuilds', text: 'This. The last 20% is where it becomes a product.' },
          { handle: 'kiwicode', text: 'Boring 80% is also where you learn the most.' },
        ],
      },
      {
        url: 'https://x.com/shaderkit/status/2002', handle: 'shaderkit', likes: 128, replies: 11, images: [],
        text: 'What is everyone using for dithering in three.js these days? Post-processing pass or a material hack?',
        thread: [{ handle: 'meshmaker', text: 'Post-processing pass, easier to tune.' }],
      },
    ],
    follows: [
      { handle: 'pixelforge', bio: 'Tiny WebGL experiments, one a week.' },
      { handle: 'lowpolylena', bio: 'Low-poly artist and indie dev.' },
    ],
  },
}

const reply = JSON.stringify({
  version: 1, platform: 'x',
  actions: [
    { id: 'L1', type: 'like', do: true, url: 'https://x.com/pixelforge/status/1001' },
    { id: 'L2', type: 'like', do: true, url: 'https://x.com/lowpolylena/status/1002' },
    { id: 'R1', type: 'reply', do: true, url: 'https://x.com/devnora/status/2001', text: 'The boring 80% is also where the real learning happens. Shipping it first changed how I plan projects.' },
    { id: 'R2', type: 'reply', do: false, url: 'https://x.com/shaderkit/status/2002', reason: 'existing reply already answers it' },
    { id: 'F1', type: 'follow', do: true, handle: 'pixelforge' },
    { id: 'F2', type: 'follow', do: true, handle: 'someone_else', text: '' },
    { id: 'L9', type: 'like', do: true, url: 'https://example.com/not-a-post' },
  ],
}, null, 2)

// demo statuses mirroring a typical state: public sites checked, login-only sites not monitored yet
const day = 86_400_000
const health = {
  updated: new Date(Date.now() - day).toISOString(),
  sites: {
    youtube: { status: 'passed', when: new Date(Date.now() - day).toISOString() },
    reddit: { status: 'blocked', when: new Date(Date.now() - day).toISOString() },
    x: { status: 'skipped' }, linkedin: { status: 'skipped' }, instagram: { status: 'skipped' },
  },
}

const ai = { provider: 'openrouter', apiKey: 'sk-or-demo-key', model: 'anthropic/claude-sonnet-5.5', baseURL: 'http://localhost:11434/v1', vision: true }

// minimal chrome.* stand-in so the panel runs outside the extension
const stub = ({ result, ai, onboarded, health }) => {
  const store = { ai, onboarded, ...(result ? { result } : {}) }
  const noop = { addListener() {}, removeListener() {} }
  const realFetch = window.fetch
  window.fetch = (u, ...a) => (String(u).includes('/health/status.json') ? Promise.resolve(new Response(JSON.stringify(health))) : realFetch(u, ...a))
  window.chrome = {
    tabs: { query: async () => [{ id: 1, url: 'https://x.com/home' }], onActivated: noop, onUpdated: noop, update() {}, sendMessage: async () => ({ ok: true }) },
    storage: { local: {
      get: async (k) => (Array.isArray(k) ? Object.fromEntries(k.filter((x) => x in store).map((x) => [x, store[x]])) : k in store ? { [k]: store[k] } : {}),
      set: async (o) => { Object.assign(store, o) },
    }, onChanged: noop },
    runtime: { onMessage: noop, sendMessage() {}, getManifest: () => ({ version: '1.0.0' }) },
    scripting: { executeScript: async () => {} },
    permissions: { contains: async () => true, request: async () => true },
  }
}

const server = http.createServer((req, res) => {
  const file = path.join('dist', req.url === '/' ? 'sidepanel.html' : decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end(); return }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }).end(buf)
  })
}).listen(0)
const url = `http://localhost:${server.address().port}/`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(scheme, { fresh = false } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2 })
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluateOnNewDocument(stub, { result: fresh ? null : result, ai: fresh ? { ...ai, apiKey: '', vision: false } : ai, onboarded: !fresh, health })
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.app')
  return page
}
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` })
const scrollMain = (page, to) => page.evaluate((t) => { const m = [...document.querySelectorAll('main')].find((x) => !x.hidden); m.scrollTop = t === 'end' ? m.scrollHeight : t }, to)
const clickText = (page, sel, text) => page.evaluate((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim().startsWith(t))?.click(), sel, text)

for (const scheme of ['dark', 'light']) {
  const page = await open(scheme)
  await shot(page, scheme === 'dark' ? 'gather' : 'gather-light')
  if (scheme === 'dark') {
    await clickText(page, 'summary', 'View')
    await wait(200)
    await scrollMain(page, 'end')
    await wait(200)
    await shot(page, 'prompt')

    await clickText(page, '.tabs button', 'Apply')
    await page.evaluate((v) => {
      const t = document.querySelector('main:not([hidden]) textarea')
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, v)
      t.dispatchEvent(new Event('input', { bubbles: true }))
    }, reply)
    await wait(100)
    await clickText(page, 'main:not([hidden]) button', 'Validate')
    await wait(200)
    await scrollMain(page, 'end')
    await shot(page, 'apply')

    await page.click('.iconbtn')
    await wait(200)
    await shot(page, 'settings')
  }
  await page.close()
}

// setup phase on a fresh install
{
  const page = await open('dark', { fresh: true })
  for (const n of ['3D & web dev', 'Indie game dev', 'AI & ML']) await clickText(page, '.chip', n)
  await wait(150)
  await shot(page, 'setup-niche')
  await clickText(page, 'main .btns button', 'Next')
  await wait(200)
  await shot(page, 'setup-guide')
  await clickText(page, 'main .btns button', 'Next')
  await wait(200)
  await shot(page, 'setup-ai')
  await page.close()
}

await browser.close()
server.close()
console.log('screenshots written to', OUT)
