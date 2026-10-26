# Contributing

Issues and PRs are welcome.

```bash
npm ci
npm test        # unit tests
npm run build   # type-check + build to dist/, then load dist/ as an unpacked extension
```

## Adding a site

Sites are adapters in `src/platforms/<site>/adapter.js`, selected by hostname in `src/platforms/adapters.js`.

1. Add the site to `src/platforms/registry.ts`: hostname, post/profile URL rules, handle regex, reply limit, vocabulary.
2. Create `adapter.js` exporting `posts`, `people`, `followState`, `readReplies` and `act` (honour `dry` in `act`: find the button, click nothing). Copy the closest existing adapter.
3. Add the host to `manifest.json` (`host_permissions` and the content script `matches`).
4. Add a probe in `scripts/probes.mjs` so the scheduled health check covers it, and verify with `npm run probe -- <site>`.

Selectors break whenever a site ships a redesign; the health check exists to tell us when. Keep adapters defensive and prefer `aria-label` / `data-testid` over class names.

## Architecture rule

Features under `src/features/*` never import each other; `src/app/App.tsx` wires them together. Shared code goes in `src/shared`.
