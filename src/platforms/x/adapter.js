import { sleep, rnd, waitFor, click, glide, behave } from '../../shared/human.js';
import { typeInto } from '../../shared/dom.js';
import { ok, skipped, fail } from '../../shared/result.js';

function parse(a) {
  if (a.querySelector('[data-testid="placementTracking"]')) return null; // ad
  const link = [...a.querySelectorAll('a[href*="/status/"]')].find((l) => l.querySelector('time'));
  if (!link) return null;
  const handle = (a.querySelector('[data-testid="User-Name"] a[href^="/"]:not([href*="/status/"])')?.getAttribute('href') || '').slice(1);
  const text = a.querySelector('[data-testid="tweetText"]')?.innerText.trim() || '';
  const label = a.querySelector('[role="group"]')?.getAttribute('aria-label') || '';
  const n = (k) => +(label.match(new RegExp('([\\d,]+) ' + k))?.[1].replace(/,/g, '') || 0);
  const images = [...a.querySelectorAll('[data-testid="tweetPhoto"] img')]
    .map((i) => i.src).filter((s) => s.includes('pbs.twimg.com/media'))
    .map((s) => { try { const u = new URL(s); u.searchParams.set('name', 'medium'); return u.toString(); } catch { return s; } })
    .slice(0, 4);
  return { url: link.href.split('?')[0], handle, text, images, likes: n('like'), replies: n('repl'), liked: !!a.querySelector('[data-testid="unlike"]') };
}

const articles = () => [...document.querySelectorAll('article[data-testid="tweet"]')];

// hover an author's name like a user would; the hover card shows Follow vs Following
async function followState(handle) {
  const a = [...document.querySelectorAll('article[data-testid="tweet"] [data-testid="User-Name"] a')].find((l) => l.getAttribute('href') === '/' + handle);
  if (!a) return 'unknown';
  const fire = (type) => a.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
  fire('mouseover'); fire('mouseenter');
  let state = 'unknown';
  for (let i = 0; i < 14 && state === 'unknown'; i++) {
    await sleep(200);
    const card = [...document.querySelectorAll('[data-testid="HoverCard"]')].find((c) => c.querySelector(`a[href="/${handle}"]`));
    if (!card) continue;
    if (card.querySelector('[data-testid$="-unfollow"]')) state = 'following';
    else if (card.querySelector('[data-testid$="-follow"]')) state = 'not-following';
    else break; // own account or no button
  }
  fire('mouseout'); fire('mouseleave');
  await sleep(rnd(300, 700));
  return state;
}

// on an opened post: read a few existing replies (so ours can differ from them)
async function readReplies(max = 8) {
  await sleep(rnd(1200, 2200));
  const replies = new Map();
  for (let i = 0; i < 4 && replies.size < max; i++) {
    await waitFor(() => articles().length, 8000);
    const posts = articles().map(parse).filter(Boolean);
    const main = posts.findIndex((p) => new URL(p.url).pathname === location.pathname);
    for (const p of posts.slice(main + 1)) { // everything after the post itself is a reply
      if (p.text && !replies.has(p.url)) replies.set(p.url, { handle: p.handle, text: p.text.slice(0, 200) });
    }
    if (replies.size >= max) break;
    await glide(rnd(300, 650));
    await behave();
  }
  return { replies: [...replies.values()].slice(0, max) };
}

const FOLLOW = '[data-testid="placementTracking"] [data-testid$="-follow"], [data-testid="placementTracking"] [data-testid$="-unfollow"]';

// runs on the already-opened post (like/reply) or profile (follow) page
async function act({ type, text, dry }) {
  if (type === 'follow') {
    const f = await waitFor(() => document.querySelector(FOLLOW));
    if (!f) return fail('follow button not found');
    if (f.dataset.testid.endsWith('-unfollow')) return skipped('already following');
    if (dry) return ok('dry run: follow button found');
    await click(f);
    return (await waitFor(() => document.querySelector('[data-testid="placementTracking"] [data-testid$="-unfollow"]'), 4000)) ? ok() : fail('follow not confirmed');
  }
  // on a reply's page the thread's first article is the original post, so pick the one the URL points at
  const art = await waitFor(() => articles().find((a) => { const u = parse(a)?.url; return u && new URL(u).pathname === location.pathname; }));
  if (!art) return fail('post not found');
  if (type === 'like') {
    if (art.querySelector('[data-testid="unlike"]')) return skipped('already liked');
    const b = art.querySelector('[data-testid="like"]');
    if (!b) return fail('like button not found');
    if (dry) return ok('dry run: like button found');
    await click(b);
    return (await waitFor(() => art.querySelector('[data-testid="unlike"]'), 4000)) ? ok() : fail('like not confirmed');
  }
  const rb = art.querySelector('[data-testid="reply"]');
  if (!rb) return fail('reply button not found');
  if (dry) return ok('dry run: reply button found');
  await click(rb);
  const box = await waitFor(() => document.querySelector('[role="dialog"] [data-testid="tweetTextarea_0"]'));
  if (!box) return fail('composer did not open');
  await typeInto(box, text);
  await sleep(rnd(800, 1800));
  const send = await waitFor(() => { const b = document.querySelector('[role="dialog"] [data-testid="tweetButton"]'); return b && b.getAttribute('aria-disabled') !== 'true' ? b : null; }, 4000);
  if (!send) return fail('reply button disabled');
  await click(send);
  return (await waitFor(() => !document.querySelector('[role="dialog"] [data-testid="tweetTextarea_0"]'), 6000)) ? ok() : fail('reply not confirmed');
}

export default {
  id: 'x',
  minReplyText: 40,
  posts: () => articles().map(parse).filter((t) => t && t.handle),
  // people lists / profile suggestions: only ones with a visible Follow button
  people: () => [...document.querySelectorAll('[data-testid="UserCell"]')]
    .filter((c) => c.querySelector('[data-testid$="-follow"]'))
    .map((c) => ({ handle: (c.querySelector('a[href^="/"]')?.getAttribute('href') || '').slice(1), bio: c.innerText.split('\n').slice(2).join(' ').slice(0, 160) }))
    .filter((p) => p.handle),
  followState, readReplies, act,
};
