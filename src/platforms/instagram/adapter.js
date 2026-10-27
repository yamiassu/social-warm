// Instagram web. Obfuscated classes are avoided; selectors rely on aria-labels, roles and text. Best-effort.
import { sleep, rnd, waitFor, click, glide, behave } from '../../shared/human.js';
import { buttonByText, typeInto } from '../../shared/dom.js';
import { ok, skipped, fail } from '../../shared/result.js';

// labels follow the account's UI language (English / Portuguese)
const LIKE = /^(like|curtir)$/i, UNLIKE = /^(unlike|descurtir)$/i;
const svgBy = (root, re) => [...root.querySelectorAll('svg[aria-label]')].find((s) => re.test(s.getAttribute('aria-label')));
// comments have hearts with the same label, so find the post's own: the like in the smallest container that also holds the Comment icon
const COMMENT = /^(comment|comentar|comentário)$/i, LIKE_ANY = /^(like|unlike|curtir|descurtir)$/i;
function postLike(root, re) {
  for (let e = svgBy(root, COMMENT)?.parentElement; e && e !== root.parentElement; e = e.parentElement) {
    if (svgBy(e, LIKE_ANY)) return svgBy(e, re);
  }
}
const articles = () => [...document.querySelectorAll('article')];
// posts have no <header> any more: the author is the first profile-looking link in the article
const RESERVED = /^(p|reel|reels|explore|direct|accounts|stories|tv)$/;
const authorLink = (a) => [...a.querySelectorAll('a[href^="/"]')].find((l) => { const m = l.getAttribute('href').match(/^\/([\w.]{1,30})\/$/); return m && !RESERVED.test(m[1]); });
const POST_LINK = 'a[href*="/p/"], a[href*="/reel/"]';

function parse(a) {
  const link = [...a.querySelectorAll(POST_LINK)].find((l) => l.querySelector('time')) || a.querySelector(POST_LINK);
  if (!link) return null;
  const u = new URL(link.getAttribute('href'), location.origin);
  const handle = (authorLink(a)?.getAttribute('href') || '').split('/')[1] || '';
  const caption = [...a.querySelectorAll('span[dir="auto"]')].map((s) => s.innerText.trim()).sort((x, y) => y.length - x.length)[0] || '';
  const images = [...a.querySelectorAll('img')].filter((i) => !/profile picture/i.test(i.alt) && i.naturalWidth > 150).map((i) => i.src).slice(0, 4);
  return { url: u.origin + u.pathname, handle, text: caption, images, likes: 0, replies: 0, liked: !!postLike(a, UNLIKE) };
}

// feed posts show "Follow" next to the username for accounts you don't follow
async function followState(handle) {
  const link = articles().map((x) => [...x.querySelectorAll(`a[href="/${handle}/"]`)][0]).find(Boolean);
  if (!link) return 'unknown';
  let header = link.parentElement; // climb until the author row (the one holding Follow/Following)
  for (let i = 0; i < 6 && header && !buttonByText(/^(following|follow)$/i, header); i++) header = header.parentElement;
  if (!header || header.tagName === 'ARTICLE') return 'unknown';
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
  // a post's own page may have no <article>: fall back to <main>, once its like button has rendered
  const art = await waitFor(() => { const r = articles()[0] || document.querySelector('main'); return r && (postLike(r, LIKE) || postLike(r, UNLIKE)) ? r : null; });
  if (!art) return fail('post not found');
  if (type === 'like') {
    if (postLike(art, UNLIKE)) return skipped('already liked');
    const b = postLike(art, LIKE)?.closest('[role="button"], button');
    if (!b) return fail('like button not found');
    if (dry) return ok('dry run: like button found');
    await click(b);
    return (await waitFor(() => postLike(art, UNLIKE), 4000)) ? ok() : fail('like not confirmed');
  }
  const box = await waitFor(() => document.querySelector('textarea[aria-label^="Add a comment"], textarea[aria-label^="Adicione um coment"]'));
  if (!box) return fail('comment box not found');
  if (dry) return ok('dry run: comment box found');
  await click(box);
  await typeInto(box, text);
  await sleep(rnd(800, 1800));
  const POST = /^(post|postar|publicar)$/i;
  const send = await waitFor(() => buttonByText(POST, box.closest('form') || art) || buttonByText(POST, document), 4000);
  if (send) await click(send);
  else { // no button found: submit with Enter, which the box also accepts
    for (const type of ['keydown', 'keyup']) box.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  }
  return (await waitFor(() => !box.value, 6000)) ? ok() : fail(`comment not confirmed (${send ? 'clicked post' : 'no post button, tried Enter'}; box has ${box.value.length} of ${text.length} chars)`);
}

export default {
  id: 'instagram',
  minReplyText: 20,
  posts: () => articles().map(parse).filter((p) => p && p.handle),
  people: () => [],
  followState, readReplies, act,
};
