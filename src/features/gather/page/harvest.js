// Platform-agnostic pool of candidates; the adapter knows how to read the DOM.
export const newPool = () => ({ tweets: new Map(), people: new Map(), verified: new Map(), checked: new Set() });

export function harvest(pool, adapter) {
  for (const p of adapter.posts()) if (!pool.tweets.has(p.url)) pool.tweets.set(p.url, p);
  // people lists / search results: only ones with a visible Follow button
  for (const p of adapter.people()) if (!pool.people.has(p.handle)) pool.people.set(p.handle, { handle: p.handle, bio: p.bio || '', confirmed: true });
}

// assign the pool to the requested quotas; replies first (need real text), likes get the rest
export function pick(pool, t, minText = 40) {
  const open = [...pool.tweets.values()].filter((x) => !x.liked);
  const eligible = open.filter((x) => x.text.length >= minText);
  const comments = eligible.slice(0, t.comments);
  const used = new Set(comments.map((x) => x.url));
  const likes = open.filter((x) => !used.has(x.url)).slice(0, t.likes);
  const follows = [...pool.people.values(), ...pool.verified.values()];
  return { comments, likes, follows: follows.slice(0, t.follows) };
}
