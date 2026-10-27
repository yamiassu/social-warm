import { glide, behave, rnd, halt } from '../../../shared/human.js';
import { harvest, newPool, pick, filterLang } from './harvest.js';
import { verifyAuthors } from './followCheck.js';

const MAX_STEPS = 80;
let stopped = false;

export const stopCollect = () => { stopped = true; halt(); };

export async function collect(adapter, t, langs = []) {
  stopped = false;
  halt(false);
  const pool = newPool();
  const choose = () => pick(pool, t, adapter.minReplyText, adapter.dropRepeats);
  let r;
  // sites that unload off-screen posts (Reddit search keeps ~20 in the DOM) lose them between steps: sample while scrolling
  const sampler = setInterval(() => harvest(pool, adapter), 300);
  for (let step = 0; step < MAX_STEPS && !stopped; step++) {
    harvest(pool, adapter);
    await filterLang(pool, langs);
    if (t.follows) await verifyAuthors(adapter, pool, t, () => stopped);
    r = choose();
    chrome.runtime.sendMessage({ type: 'progress', step, max: MAX_STEPS, got: { likes: r.likes.length, comments: r.comments.length, follows: r.follows.length } });
    if (r.likes.length >= t.likes && r.comments.length >= t.comments && r.follows.length >= t.follows) break;
    await glide(rnd(320, 760));
    await behave();
  }
  clearInterval(sampler);
  harvest(pool, adapter);
  await filterLang(pool, langs);
  const result = { platform: adapter.id, page: location.href, data: choose(), stopped, at: Date.now() };
  chrome.storage.local.set({ result }); // survives the panel being closed mid-run
  halt(false);
  chrome.runtime.sendMessage({ type: 'done', ...result });
}
