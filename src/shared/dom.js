import { sleep, rnd } from './human.js';

// querySelectorAll that also pierces open shadow roots (Reddit's web components)
export function deepAll(sel, root = document) {
  const out = [...root.querySelectorAll(sel)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) out.push(...deepAll(sel, el.shadowRoot));
  return out;
}
export const deep = (sel, root = document) => deepAll(sel, root)[0] || null;

const textOf = (el) => (el.innerText ?? el.textContent ?? '').trim();
export const buttonByText = (re, root = document, sel = 'button, [role="button"]') => deepAll(sel, root).find((b) => re.test(textOf(b))) || null;

// "1.2K" / "3,400" -> number
export function num(s = '') {
  const m = String(s).replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  return Math.round(parseFloat(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1));
}

// type into a focused editable like a person (works for textarea and contenteditable).
// bulk: put the text in at once instead (paste, then one insertText if the field is still empty): X's Draft.js
// resets the caret on every typed character and repeats the first letters.
export async function typeInto(el, text, bulk = false) {
  el.focus();
  if (!bulk) {
    for (const ch of text) { document.execCommand('insertText', false, ch); await sleep(rnd(40, 130)); }
    return;
  }
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  await sleep(rnd(300, 600));
  if (!(el.value ?? el.innerText ?? '').trim()) { // paste did nothing: insert in one go (never selectAll, it can grab the whole page)
    el.focus();
    document.execCommand('insertText', false, text);
    await sleep(rnd(300, 600));
  }
}
