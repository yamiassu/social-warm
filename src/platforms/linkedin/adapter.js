// LinkedIn feed. Class names are best-effort and change often; prefer aria-labels where possible.
import { sleep, rnd, waitFor, click, glide, behave } from '../../shared/human.js';
import { buttonByText, num, typeInto } from '../../shared/dom.js';
import { ok, skipped, fail } from '../../shared/result.js';

const FEED = 'div[data-urn^="urn:li:activity"], div[data-urn^="urn:li:share"], div[data-urn^="urn:li:ugcPost"]';
const postEls = () => [...document.querySelectorAll(FEED)];

function parse(el) {
  const urn = el.getAttribute('data-urn');
  const actor = el.querySelector('a.update-components-actor__meta-link, a.update-components-actor__container-link');
  const handle = decodeURIComponent((actor?.getAttribute('href') || '').match(/\/(?:in|company)\/([^/?]+)/)?.[1] || '');
  const text = el.querySelector('.update-components-text, .feed-shared-text')?.innerText.trim() || '';
  if (!urn || !handle) return null;
  return {
    url: `https://www.linkedin.com/feed/update/${urn}/`, handle, text,
    images: [...el.querySelectorAll('.update-components-image img')].map((i) => i.src).filter(Boolean).slice(0, 4),
    likes: num(el.querySelector('.social-details-social-counts__reactions-count')?.innerText),
    replies: num(el.querySelector('.social-details-social-counts__comments')?.innerText),
    liked: !!el.querySelector('button[aria-label^="Unreact"], button[aria-pressed="true"][aria-label*="eact"]'),
  };
}

// a post header shows "Follow" for accounts you don't follow or connect with
async function followState(handle) {
  const el = postEls().find((p) => (p.querySelector('a.update-components-actor__meta-link')?.getAttribute('href') || '').includes(`/${handle}`));
  if (!el) return 'unknown';
  if (el.querySelector('button[aria-label^="Following"]')) return 'following';
  return el.querySelector('button[aria-label^="Follow "]') ? 'not-following' : 'unknown';
}

async function readReplies(max = 8) {
  await sleep(rnd(1500, 2500));
  const replies = new Map();
  for (let i = 0; i < 4 && replies.size < max; i++) {
    for (const c of document.querySelectorAll('article.comments-comment-entity')) {
      const text = c.querySelector('.comments-comment-item__main-content')?.innerText.trim();
      const id = c.getAttribute('data-id');
      if (text && id && !replies.has(id)) replies.set(id, { handle: c.querySelector('.comments-comment-meta__description-title')?.innerText.trim() || '', text: text.slice(0, 200) });
    }
    if (replies.size >= max) break;
    await glide(rnd(400, 800));
    await behave();
  }
  return { replies: [...replies.values()].slice(0, max) };
}

async function act({ type, text, dry }) {
  if (type === 'follow') {
    const f = await waitFor(() => document.querySelector('main button[aria-label^="Follow "], main button[aria-label^="Following"]'));
    if (!f) return fail('follow button not found (it may be under "More")');
    if (f.getAttribute('aria-label').startsWith('Following')) return skipped('already following');
    if (dry) return ok('dry run: follow button found');
    await click(f);
    return (await waitFor(() => document.querySelector('main button[aria-label^="Following"]'), 4000)) ? ok() : fail('follow not confirmed');
  }
  const post = await waitFor(() => postEls()[0]);
  if (!post) return fail('post not found');
  if (type === 'like') {
    if (post.querySelector('button[aria-label^="Unreact"]')) return skipped('already reacted');
    const b = post.querySelector('button[aria-label^="React Like"], button.react-button__trigger');
    if (!b) return fail('like button not found');
    if (dry) return ok('dry run: like button found');
    await click(b);
    return (await waitFor(() => post.querySelector('button[aria-label^="Unreact"]'), 4000)) ? ok() : fail('like not confirmed');
  }
  const cb = post.querySelector('button[aria-label^="Comment"], button.comment-button');
  if (!cb) return fail('comment button not found');
  if (dry) return ok('dry run: comment button found');
  await click(cb);
  const editor = await waitFor(() => post.querySelector('.ql-editor[contenteditable="true"]') || document.querySelector('.ql-editor[contenteditable="true"]'));
  if (!editor) return fail('comment editor did not open');
  await typeInto(editor, text);
  await sleep(rnd(800, 1800));
  const send = await waitFor(() => { const b = document.querySelector('button[class*="comments-comment-box__submit-button"]') || buttonByText(/^(comment|post)$/i, post); return b && !b.disabled ? b : null; }, 4000);
  if (!send) return fail('comment submit button not found/disabled');
  await click(send);
  return (await waitFor(() => !editor.innerText.trim() || editor.classList.contains('ql-blank'), 6000)) ? ok() : fail('comment not confirmed');
}

export default {
  id: 'linkedin',
  minReplyText: 40,
  posts: () => postEls().map(parse).filter(Boolean),
  people: () => [],
  followState, readReplies, act,
};
