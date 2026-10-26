import { createHighlighter } from '@tanstack/highlight/core'
import { json } from '@tanstack/highlight/languages/json'
import { markdown } from '@tanstack/highlight/languages/markdown'
import { createThemeCss, type HighlightTheme } from '@tanstack/highlight/theme'

export const highlighter = createHighlighter({ languages: [json, markdown] })

// brand themes: violet keywords, pink strings, on transparent so the card shows through
const tokens = (c: Record<'key' | 'str' | 'num' | 'cmt' | 'prop' | 'fn' | 'op' | 'head', string>): HighlightTheme['tokens'] => ({
  token: c.op, attr: c.prop, 'code-inline': c.op, command: c.fn, comment: c.cmt, deleted: c.str, function: c.fn,
  heading: c.head, inserted: c.fn, keyword: c.key, link: c.prop, literal: c.num, meta: c.cmt, number: c.num,
  operator: c.op, property: c.prop, selector: c.key, string: c.str, tag: c.key, type: c.fn, variable: c.prop,
})

const dark: HighlightTheme = {
  name: 'warm-dark', type: 'dark', background: 'transparent', foreground: '#e8eaf2',
  tokens: tokens({ key: '#b9a6ff', str: '#ff9ec4', num: '#ffd479', cmt: '#6f7894', prop: '#8ec5ff', fn: '#8ff0c4', op: '#aab1cc', head: '#ff7eb6' }),
}
const light: HighlightTheme = {
  name: 'warm-light', type: 'light', background: 'transparent', foreground: '#1b1a2e',
  tokens: tokens({ key: '#5b3fd6', str: '#c2255f', num: '#b45309', cmt: '#8a88a6', prop: '#1d6fc4', fn: '#0f8a5f', op: '#55546e', head: '#c2255f' }),
}

const css = createThemeCss({ light, dark, darkSelector: '.dark' })

// inject theme CSS once and mirror the OS colour scheme as the `.dark` class
export function installHighlightTheme() {
  const style = document.createElement('style')
  style.textContent = css
  document.head.append(style)
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const sync = () => document.documentElement.classList.toggle('dark', mq.matches)
  sync()
  mq.addEventListener('change', sync)
}
