// check unseen authors until enough confirmed not-followed accounts (capped, never trust 'unknown')
export async function verifyAuthors(adapter, pool, t, isStopped) {
  for (const x of pool.tweets.values()) {
    if (isStopped() || pool.verified.size + pool.people.size >= t.follows || pool.checked.size >= 40) return;
    if (pool.checked.has(x.handle) || pool.people.has(x.handle)) continue;
    pool.checked.add(x.handle);
    if ((await adapter.followState(x.handle)) === 'not-following') pool.verified.set(x.handle, { handle: x.handle, bio: x.text.slice(0, 160), confirmed: true });
  }
}
