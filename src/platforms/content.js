// Content-script entry: picks the adapter for this site and routes panel messages to it.
import { collect, stopCollect } from '../features/gather/page/collect.js';
import { sleep, rnd } from '../shared/human.js';
import { fail } from '../shared/result.js';
import { adapterFor } from './adapters.js';

const adapter = adapterFor(location.hostname);

if (adapter && !window.__socialWarm) {
  window.__socialWarm = true;
  chrome.runtime.onMessage.addListener((m, _s, reply) => {
    if (m.type === 'act') {
      sleep(rnd(1500, 3500)) // look at the page first
        .then(() => adapter.act(m.action))
        .then(reply, (e) => reply(fail(String(e))));
      return true;
    }
    if (m.type === 'replies') {
      adapter.readReplies(m.max).then(reply, () => reply({ replies: [] }));
      return true;
    }
    if (m.type === 'collect') collect(adapter, m.targets);
    if (m.type === 'stop') stopCollect();
    reply({ ok: true });
  });
}
