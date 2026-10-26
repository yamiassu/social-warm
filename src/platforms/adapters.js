import x from './x/adapter.js';
import reddit from './reddit/adapter.js';
import linkedin from './linkedin/adapter.js';
import instagram from './instagram/adapter.js';
import youtube from './youtube/adapter.js';

const BY_HOST = [
  [/(^|\.)(x|twitter)\.com$/, x],
  [/(^|\.)reddit\.com$/, reddit],
  [/(^|\.)linkedin\.com$/, linkedin],
  [/(^|\.)instagram\.com$/, instagram],
  [/(^|\.)youtube\.com$/, youtube],
];

export const adapterFor = (host) => BY_HOST.find(([re]) => re.test(host))?.[1];
