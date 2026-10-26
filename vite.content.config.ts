import { defineConfig } from 'vite'

// content scripts can't use ES modules: bundle the page-side code into one IIFE
export default defineConfig({
  build: {
    emptyOutDir: false,
    copyPublicDir: false,
    lib: { entry: 'src/platforms/content.js', formats: ['iife'], name: 'SocialWarmContent', fileName: () => 'content.js' },
  },
})
