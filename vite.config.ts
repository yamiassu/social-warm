import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { redact } from '@tanstack/redact/vite'

// panel build; public/ (manifest, background) is copied to dist as-is.
// emptyOutDir is off so the content-script build (vite.content.config.ts) can share dist/.
// Redact swaps in a smaller React-compatible runtime. Context, Suspense, memo and class components
// stay on (TanStack Query/Form need them); the panel never hydrates, portals or uses Activity.
export default defineConfig({
  plugins: [react(), redact({ features: { hydration: false, activity: false, fragmentRefs: false, portal: false } })],
  base: './',
  build: { emptyOutDir: false, rollupOptions: { input: 'sidepanel.html' } },
})
