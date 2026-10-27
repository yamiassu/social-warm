// Platform-agnostic pool of candidates; the adapter knows how to read the DOM.
export const newPool = () => ({ tweets: new Map(), people: new Map(), verified: new Map(), checked: new Set(), rejected: new Set() });

export function harvest(pool, adapter) {
  for (const p of adapter.posts()) if (!pool.tweets.has(p.url) && !pool.rejected.has(p.url)) pool.tweets.set(p.url, p);
  // people lists / search results: only ones with a visible Follow button
  for (const p of adapter.people()) if (!pool.people.has(p.handle)) pool.people.set(p.handle, { handle: p.handle, bio: p.bio || '', confirmed: true });
}

// drop posts whose text isn't in one of `langs` (base codes); unreliable detection counts as no match
export async function filterLang(pool, langs) {
  if (!langs.length) return;
  for (const [url, p] of pool.tweets) {
    if (p.lang !== undefined) continue;
    const d = await chrome.i18n.detectLanguage(p.text);
    p.lang = d.isReliable ? d.languages[0]?.language.toLowerCase().split('-')[0] ?? '' : '';
    if (!langs.includes(p.lang)) { pool.tweets.delete(url); pool.rejected.add(url); }
  }
}

// assign the pool to the requested quotas; replies first (need real text), likes get the rest
export function pick(pool, t, minText = 40, dropRepeats = false) {
  let open = [...pool.tweets.values()].filter((x) => !x.liked);
  if (dropRepeats) { // same text posted more than once (e.g. across subreddits) = spam: keep none of them
    const key = (x) => x.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const seen = new Map();
    for (const x of pool.tweets.values()) seen.set(key(x), (seen.get(key(x)) || 0) + 1);
    open = open.filter((x) => seen.get(key(x)) === 1);
  }
  const eligible = open.filter((x) => x.text.length >= minText);
  const comments = eligible.slice(0, t.comments);
  const used = new Set(comments.map((x) => x.url));
  const likes = open.filter((x) => !used.has(x.url)).slice(0, t.likes);
  const follows = [...pool.people.values(), ...pool.verified.values()];
  return { comments, likes, follows: follows.slice(0, t.follows) };
}
