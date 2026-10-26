// YouTube: videos are the "posts" (like = like the video, reply = comment on it, follow = subscribe). Best-effort selectors.
import { sleep, rnd, waitFor, click, glide, behave } from '../../shared/human.js';
import { buttonByText, typeInto } from '../../shared/dom.js';
import { ok, skipped, fail } from '../../shared/result.js';

const VIDEO = 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer';
const handleOf = (href = '') => decodeURIComponent((href.match(/\/@([^/?]+)/) || [])[1] || '');

function parse(el) {
  const a = el.querySelector('a#thumbnail[href*="/watch"], a#video-title-link, a#video-title');
  const v = a && new URL(a.getAttribute('href'), location.origin).searchParams.get('v');
  if (!v) return null;
  const title = (el.querySelector('#video-title')?.innerText || a.getAttribute('title') || '').trim();
  const snippet = el.querySelector('#description-text, .metadata-snippet-text')?.innerText.trim() || '';
  const channel = el.querySelector('ytd-channel-name a, a[href^="/@"]');
  const thumb = el.querySelector('img[src*="ytimg"]')?.src;
  return {
    url: `https://www.youtube.com/watch?v=${v}`, handle: handleOf(channel?.getAttribute('href')),
    text: (title + (snippet ? ' — ' + snippet : '')).trim(), images: thumb ? [thumb] : [],
    likes: 0, replies: 0, liked: false,
  };
}

async function readReplies(max = 8) {
  await sleep(rnd(1500, 2500));
  await glide(rnd(500, 800)); // comments load lazily below the player
  const replies = new Map();
  for (let i = 0; i < 4 && replies.size < max; i++) {
    await waitFor(() => document.querySelector('ytd-comment-thread-renderer'), 8000);
    for (const c of document.querySelectorAll('ytd-comment-thread-renderer')) {
      const text = c.querySelector('#content-text')?.innerText.trim();
      const handle = c.querySelector('#author-text')?.innerText.trim().replace(/^@/, '') || '';
      if (text && !replies.has(handle + text)) replies.set(handle + text, { handle, text: text.slice(0, 200) });
    }
    if (replies.size >= max) break;
    await glide(rnd(400, 800));
    await behave();
  }
  return { replies: [...replies.values()].slice(0, max) };
}

const SUB = 'ytd-subscribe-button-renderer button, yt-subscribe-button-view-model button';

async function act({ type, text, dry }) {
  if (type === 'follow') {
    const b = await waitFor(() => buttonByText(/^subscribe(d)?$/i, document, SUB));
    if (!b) return fail('subscribe button not found (channel page)');
    if (/subscribed/i.test(b.innerText)) return skipped('already subscribed');
    if (dry) return ok('dry run: subscribe button found');
    await click(b);
    return (await waitFor(() => buttonByText(/^subscribed$/i, document, SUB), 4000)) ? ok() : fail('subscribe not confirmed');
  }
  if (type === 'like') {
    const b = await waitFor(() => document.querySelector('like-button-view-model button, #segmented-like-button button'));
    if (!b) return fail('like button not found (watch page)');
    if (b.getAttribute('aria-pressed') === 'true') return skipped('already liked');
    if (dry) return ok('dry run: like button found');
    await click(b);
    return (await waitFor(() => b.getAttribute('aria-pressed') === 'true', 4000)) ? ok() : fail('like not confirmed');
  }
  await sleep(rnd(500, 1200));
  await glide(rnd(500, 800)); // comments load lazily below the player
  const ph = await waitFor(() => document.querySelector('ytd-comments #simple-box #placeholder-area, #placeholder-area'));
  if (!ph) return fail('comment box not found (comments may be off)');
  if (dry) return ok('dry run: comment box found');
  await click(ph);
  const editor = await waitFor(() => document.querySelector('#contenteditable-root'));
  if (!editor) return fail('comment editor did not open');
  await typeInto(editor, text);
  await sleep(rnd(800, 1800));
  const send = await waitFor(() => { const b = document.querySelector('ytd-commentbox #submit-button button, #submit-button button'); return b && !b.disabled ? b : null; }, 4000);
  if (!send) return fail('comment button not found/disabled');
  await click(send);
  return (await waitFor(() => !editor.innerText.trim(), 6000)) ? ok() : fail('comment not confirmed');
}

export default {
  id: 'youtube',
  minReplyText: 10,
  posts: () => [...document.querySelectorAll(VIDEO)].map(parse).filter((p) => p && p.handle),
  // search results with channels: only ones with a visible Subscribe button
  people: () => [...document.querySelectorAll('ytd-channel-renderer')]
    .filter((c) => buttonByText(/^subscribe$/i, c, SUB))
    .map((c) => ({ handle: handleOf(c.querySelector('a[href^="/@"]')?.getAttribute('href')), bio: c.querySelector('#description')?.innerText.trim().slice(0, 160) || '' }))
    .filter((p) => p.handle),
  followState: async () => 'unknown', // subscribe state isn't visible on the feed
  readReplies, act,
};
