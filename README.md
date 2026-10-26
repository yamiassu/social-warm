# Social Warm-Up

Chrome side-panel extension (Manifest V3, React + TanStack) that warms up an account on X, Reddit, LinkedIn, Instagram or YouTube: gather posts to like, reply to and follow, copy them as one prompt, then paste the AI's JSON reply back and apply it.

## Develop
```bash
npm install
npm run build      # type-check + build to dist/
npm run dev        # watch panel + content script
npm run icons      # regenerate icons + store images from assets/icon.svg
npm run zip        # build and write social-warm.zip for the Web Store
```
Load `dist/` at `chrome://extensions` (Developer mode → Load unpacked).

## Layout (vertical slices)
```
src/
  app/                 composition root: App shell, main, styles
  features/
    gather/            collect targets -> one prompt
      GatherTab.tsx, gather.prompt.ts, gather.model.ts, useSavedGather.ts
      page/            runs inside the X page: collect, harvest, followCheck
    apply/             paste JSON -> validate -> dry run / apply
      ApplyTab.tsx, apply.parse.ts, apply.run.ts, apply.model.ts
      page/act.js      like / reply / follow on the page
    ai/                BYO model: provider settings, run prompt (TanStack AI)
    settings/          counts + base prompt, persisted
  platforms/           one adapter per site (selectors + actions) + registry (URL rules)
    x/ reddit/ linkedin/ instagram/ youtube/   adapter.js each
    content.js         content-script entry: picks the adapter by hostname
  shared/              chrome messaging, icons, human-like timing
public/                manifest.json, background.js, icons
assets/icon.svg        logo source of truth
```
Two builds share `dist/`: the panel (`vite.config.ts`) and the content script bundled as an IIFE (`vite.content.config.ts`). Features never import each other; they share only `shared/` and `settings/`.

## Response format
The copied prompt ends with a required format; Apply accepts:
```json
{ "version": 1, "actions": [
  { "id": "L1", "type": "like", "do": true, "url": "https://x.com/u/status/1" },
  { "id": "R1", "type": "reply", "do": true, "url": "https://x.com/u/status/2", "text": "…" },
  { "id": "F1", "type": "follow", "do": false, "handle": "someone", "reason": "…" } ] }
```

Page selectors for Reddit, LinkedIn, Instagram and YouTube are best-effort and need real-world tuning: run a Dry run first and use the error report. These platforms restrict automation in their terms.

Not affiliated with X Corp. Automation can violate platform rules; keep counts small and review every reply.
