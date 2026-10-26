import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// panel build; public/ (manifest, background) is copied to dist as-is.
// emptyOutDir is off so the content-script build (vite.content.config.ts) can share dist/.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { emptyOutDir: false, rollupOptions: { input: 'sidepanel.html' } },
})
