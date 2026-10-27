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

// search results aren't shreddit-post: each card has a post-title link (aria-label = title); the card is the
// nearest ancestor holding only that one title link
function parseResult(a) {
  const card = (() => { let e = a; while (e.parentElement && e.parentElement.querySelectorAll('[data-testid="post-title"]').length === 1) e = e.parentElement; return e; })();
  const href = a.getAttribute('href');
  if (!href) return null;
  return {
    url: new URL(href, location.origin).href.split('?')[0],
    handle: (card.querySelector('a[href^="/user/"], a[href^="/u/"]')?.getAttribute('href') || '').split('/')[2] || 'unknown',
    text: (a.getAttribute('aria-label') || a.innerText).trim(),
    images: [], likes: 0, replies: 0, liked: false,
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
  // the real editor sits in the DOM hidden (0x0) until the collapsed box ("Join the conversation") is clicked
  const shown = (e) => e && (e.offsetWidth || e.offsetHeight);
  const live = () => deepAll('[contenteditable="true"]').find(shown);
  let editor = live();
  if (!editor) {
    const opener = [...deepAll('textarea', host), ...deepAll('textarea')].find((t) => shown(t) && /conversa|conversation|comment/i.test(t.getAttribute('aria-label') || t.placeholder || ''))
      || deepAll('textarea, faceplate-textarea-input, button', host).find(shown);
    if (opener) { opener.focus(); await click(opener); } // the box expands on focus; a bare click() doesn't focus it
    editor = await waitFor(live, 5000);
  }
  if (!editor) return fail('comment editor did not open');
  await typeInto(editor, text);
  await sleep(rnd(800, 1800));
  const ready = () => { const b = buttonByText(/^(comment|comentar)$/i, host) || buttonByText(/^(comment|comentar)$/i); return b && !b.disabled && b.getAttribute('aria-disabled') !== 'true' ? b : null; };
  let send = await waitFor(ready, 3000);
  if (!send) { // the editor may not have registered the text: nudge it with a real edit, then look again
    editor.focus();
    document.execCommand('insertText', false, ' ');
    document.execCommand('delete');
    send = await waitFor(ready, 3000);
  }
  if (!send) {
    const b = buttonByText(/^(comment|comentar)$/i, host);
    const now = deepAll('[contenteditable="true"]').find(shown); // the editor node can be replaced while typing
    return fail(`comment button ${b ? 'disabled' : 'not found'} (editor has ${(now?.innerText || '').trim().length} of ${text.length} chars)`);
  }
  await click(send);
  return (await waitFor(() => !(deep('[contenteditable="true"]', host)?.innerText || '').trim(), 6000)) ? ok() : fail('comment not confirmed');
}

export default {
  id: 'reddit',
  minReplyText: 20,
  dropRepeats: true, // the same title in several subreddits is spam
  posts: () => [
    ...[...document.querySelectorAll('shreddit-post')].map(parse).filter((p) => p && p.handle),
    ...[...document.querySelectorAll('a[data-testid="post-title"]')].map(parseResult).filter(Boolean),
  ],
  people: () => [],
  followState: async () => 'unknown', // no follow state on the feed
  readReplies, act,
};
