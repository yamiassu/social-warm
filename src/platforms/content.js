// Content-script entry: picks the adapter for this site and routes panel messages to it.
import { collect, stopCollect } from '../features/gather/page/collect.js';
import { sleep, rnd } from '../shared/human.js';
import { fail } from '../shared/result.js';
import { adapterFor } from './adapters.js';

const adapter = adapterFor(location.hostname);

// captcha / rate-limit / lock screens: look at the title, any dialog, and short pages (a wall is rarely a full feed)
const WALL = /captcha|unusual activity|rate limit|too many requests|try again later|temporarily (locked|restricted|blocked)|verify (that )?you.re (human|not a robot)|suspicious activity/i;
const walled = () => {
  const body = document.body?.innerText ?? '';
  const dialogs = [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map((d) => d.innerText).join(' ');
  return WALL.test(`${document.title} ${dialogs} ${body.length < 1500 ? body : ''}`);
};

if (adapter && !window.__socialWarm) {
  window.__socialWarm = true;
  chrome.runtime.onMessage.addListener((m, _s, reply) => {
    if (m.type === 'act') {
      sleep(rnd(1500, 3500)) // look at the page first
        .then(() => (walled() ? fail('blocked: the site is showing a challenge or rate limit') : adapter.act(m.action)))
        .then((r) => reply(r.status === 'failed' && walled() ? fail('blocked: the site is showing a challenge or rate limit') : r), (e) => reply(fail(String(e))));
      return true;
    }
    if (m.type === 'replies') {
      adapter.readReplies(m.max).then(reply, () => reply({ replies: [] }));
      return true;
    }
    if (m.type === 'collect') collect(adapter, m.targets, m.langs);
    if (m.type === 'stop') stopCollect();
    reply({ ok: true });
  });
}
