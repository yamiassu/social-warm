// Reddit (new "shreddit" UI: web components with open shadow roots). Selectors are best-effort.
import { sleep, rnd, waitFor, click, glide, behave } from '../../shared/human.js';
import { deep, deepAll, buttonByText, num, typeInto } from '../../shared/dom.js';
import { ok, skipped, fail } from '../../shared/result.js';

function parse(el) {
  const permalink = el.getAttribute('permalink');
  if (!permalink) return null;
  const title = el.getAttribute('post-title') || '';
  const body = el.querySelector('[slot="text-body"]')?.innerText.trim() || '';
  const images = [...el.querySelectorAll('[slot="post-media-container"] img')].map((i) => i.src).filter((s) => /redd\.it|redditmedia/.test(s)).slice(0, 4);
  return {
    url: new URL(permalink, location.origin).href.split('?')[0],
    handle: el.getAttribute('author') || '',
    text: (title + (body ? ' — ' + body.slice(0, 300) : '')).trim(),
    images, likes: num(el.getAttribute('score')), replies: num(el.getAttribute('comment-count')),
    liked: el.shadowRoot?.querySelector('button[upvote]')?.getAttribute('aria-pressed') === 'true',
  };
}

async function readReplies(max = 8) {
  await sleep(rnd(1500, 2500));
  const replies = new Map();
  for (let i = 0; i < 4 && replies.size < max; i++) {
    for (const c of document.querySelectorAll('shreddit-comment')) {
      const text = c.querySelector('[slot="comment"]')?.innerText.trim();
      const id = c.getAttribute('thingid');
      if (text && id && !replies.has(id)) replies.set(id, { handle: c.getAttribute('author') || '', text: text.slice(0, 200) });
    }
    if (replies.size >= max) break;
    await glide(rnd(400, 800));
    await behave();
  }
  return { replies: [...replies.values()].slice(0, max) };
}

async function act({ type, text, dry }) {
  if (type === 'follow') {
    const f = await waitFor(() => buttonByText(/^follow(ing)?$/i));
    if (!f) return fail('follow button not found (profile page)');
    if (/following/i.test(f.innerText)) return skipped('already following');
    if (dry) return ok('dry run: follow button found');
    await click(f);
    return (await waitFor(() => buttonByText(/^following$/i), 4000)) ? ok() : fail('follow not confirmed');
  }
  const post = await waitFor(() => document.querySelector('shreddit-post'));
  if (!post) return fail('post not found');
  if (type === 'like') {
    const b = post.shadowRoot?.querySelector('button[upvote]') || deep('button[upvote]');
    if (!b) return fail('upvote button not found');
    if (b.getAttribute('aria-pressed') === 'true') return skipped('already upvoted');
    if (dry) return ok('dry run: upvote button found');
    await click(b);
    return (await waitFor(() => b.getAttribute('aria-pressed') === 'true', 4000)) ? ok() : fail('upvote not confirmed');
  }
  const host = await waitFor(() => document.querySelector('comment-composer-host'));
  if (!host) return fail('comment composer not found');
  if (dry) return ok('dry run: comment composer found');
  let editor = deep('[contenteditable="true"]', host);
  if (!editor) { // collapsed composer: open it first
    const opener = deep('faceplate-textarea-input, button', host);
    if (opener) await click(opener);
    editor = await waitFor(() => deep('[contenteditable="true"]', host), 5000);
  }
  if (!editor) return fail('comment editor did not open');
  await typeInto(editor, text);
  await sleep(rnd(800, 1800));
  const send = await waitFor(() => { const b = buttonByText(/^comment$/i, host); return b && !b.disabled ? b : null; }, 4000);
  if (!send) return fail('comment button not found/disabled');
  await click(send);
  return (await waitFor(() => !(deep('[contenteditable="true"]', host)?.innerText || '').trim(), 6000)) ? ok() : fail('comment not confirmed');
}

export default {
  id: 'reddit',
  minReplyText: 20,
  posts: () => [...document.querySelectorAll('shreddit-post')].map(parse).filter((p) => p && p.handle),
  people: () => [],
  followState: async () => 'unknown', // no follow state on the feed
  readReplies, act,
};
