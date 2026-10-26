// Instagram web. Obfuscated classes are avoided; selectors rely on aria-labels, roles and text. Best-effort.
import { sleep, rnd, waitFor, click, glide, behave } from '../../shared/human.js';
import { buttonByText, typeInto } from '../../shared/dom.js';
import { ok, skipped, fail } from '../../shared/result.js';

const articles = () => [...document.querySelectorAll('article')];
const POST_LINK = 'a[href*="/p/"], a[href*="/reel/"]';

function parse(a) {
  const link = [...a.querySelectorAll(POST_LINK)].find((l) => l.querySelector('time')) || a.querySelector(POST_LINK);
  if (!link) return null;
  const u = new URL(link.getAttribute('href'), location.origin);
  const handle = (a.querySelector('header a[href^="/"]')?.getAttribute('href') || '').split('/')[1] || '';
  const caption = [...a.querySelectorAll('span[dir="auto"]')].map((s) => s.innerText.trim()).sort((x, y) => y.length - x.length)[0] || '';
  const images = [...a.querySelectorAll('img')].filter((i) => !/profile picture/i.test(i.alt) && i.naturalWidth > 150).map((i) => i.src).slice(0, 4);
  return { url: u.origin + u.pathname, handle, text: caption, images, likes: 0, replies: 0, liked: !!a.querySelector('svg[aria-label="Unlike"]') };
}

// feed posts show "Follow" next to the username for accounts you don't follow
async function followState(handle) {
  const a = articles().find((x) => x.querySelector(`header a[href="/${handle}/"]`));
  if (!a) return 'unknown';
  const header = a.querySelector('header');
  if (buttonByText(/^following$/i, header)) return 'following';
  return buttonByText(/^follow$/i, header) ? 'not-following' : 'unknown';
}

async function readReplies(max = 8) {
  await sleep(rnd(1500, 2500));
  const replies = new Map();
  for (let i = 0; i < 4 && replies.size < max; i++) {
    for (const li of document.querySelectorAll('article ul li')) {
      const handle = li.querySelector('a[href^="/"]')?.innerText.trim() || '';
      const text = [...li.querySelectorAll('span[dir="auto"]')].map((s) => s.innerText.trim()).sort((x, y) => y.length - x.length)[0];
      if (text && handle && !replies.has(handle + text)) replies.set(handle + text, { handle, text: text.slice(0, 200) });
    }
    if (replies.size >= max) break;
    await glide(rnd(300, 600));
    await behave();
  }
  return { replies: [...replies.values()].slice(0, max) };
}

async function act({ type, text, dry }) {
  if (type === 'follow') {
    const f = await waitFor(() => buttonByText(/^(follow|follow back)$/i, document.querySelector('header') || document) || buttonByText(/^(following|requested)$/i, document.querySelector('header') || document));
    if (!f) return fail('follow button not found (profile page)');
    if (/^(following|requested)$/i.test(f.innerText.trim())) return skipped('already following / requested');
    if (dry) return ok('dry run: follow button found');
    await click(f);
    return (await waitFor(() => buttonByText(/^(following|requested)$/i, document.querySelector('header') || document), 4000)) ? ok() : fail('follow not confirmed');
  }
  const art = await waitFor(() => articles()[0]);
  if (!art) return fail('post not found');
  if (type === 'like') {
    if (art.querySelector('svg[aria-label="Unlike"]')) return skipped('already liked');
    const b = art.querySelector('svg[aria-label="Like"]')?.closest('[role="button"], button');
    if (!b) return fail('like button not found');
    if (dry) return ok('dry run: like button found');
    await click(b);
    return (await waitFor(() => art.querySelector('svg[aria-label="Unlike"]'), 4000)) ? ok() : fail('like not confirmed');
  }
  const box = await waitFor(() => art.querySelector('textarea[aria-label^="Add a comment"]') || document.querySelector('textarea[aria-label^="Add a comment"]'));
  if (!box) return fail('comment box not found');
  if (dry) return ok('dry run: comment box found');
  await click(box);
  await typeInto(box, text);
  await sleep(rnd(800, 1800));
  const send = await waitFor(() => buttonByText(/^post$/i, box.closest('form') || art), 4000);
  if (!send) return fail('post button not found');
  await click(send);
  return (await waitFor(() => !box.value, 6000)) ? ok() : fail('comment not confirmed');
}

export default {
  id: 'instagram',
  minReplyText: 20,
  posts: () => articles().map(parse).filter((p) => p && p.handle),
  people: () => [],
  followState, readReplies, act,
};
