import { glide, behave, rnd } from '../../../shared/human.js';
import { harvest, newPool, pick } from './harvest.js';
import { verifyAuthors } from './followCheck.js';

const MAX_STEPS = 80;
let stopped = false;

export const stopCollect = () => { stopped = true; };

export async function collect(adapter, t) {
  stopped = false;
  const pool = newPool();
  const choose = () => pick(pool, t, adapter.minReplyText);
  let r;
  for (let step = 0; step < MAX_STEPS && !stopped; step++) {
    harvest(pool, adapter);
    if (t.follows) await verifyAuthors(adapter, pool, t, () => stopped);
    r = choose();
    chrome.runtime.sendMessage({ type: 'progress', step, max: MAX_STEPS, got: { likes: r.likes.length, comments: r.comments.length, follows: r.follows.length } });
    if (r.likes.length >= t.likes && r.comments.length >= t.comments && r.follows.length >= t.follows) break;
    await glide(rnd(320, 760));
    await behave();
  }
  harvest(pool, adapter);
  const result = { platform: adapter.id, page: location.href, data: choose(), stopped, at: Date.now() };
  chrome.storage.local.set({ result }); // survives the panel being closed mid-run
  chrome.runtime.sendMessage({ type: 'done', ...result });
}
