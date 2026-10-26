// Watch both builds (panel + content script) side by side.
import { spawn } from 'node:child_process'

for (const args of [['build', '--watch'], ['build', '-c', 'vite.content.config.ts', '--watch']]) {
  spawn('npx', ['vite', ...args], { stdio: 'inherit', shell: true })
}
