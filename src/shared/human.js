// Human-like timing and interaction primitives, used by every page-side feature.
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// eased scroll with random duration, like a wheel/trackpad flick
export function glide(dy) {
  const dur = rnd(450, 1000), y0 = scrollY, t0 = performance.now();
  return new Promise((done) => {
    (function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, y0 + dy * ease(t));
      t < 1 ? requestAnimationFrame(frame) : done();
    })(t0);
  });
}

// pause like someone reading; sometimes a long look, sometimes a back-scroll
export async function behave() {
  await sleep(rnd(700, 2200));
  if (Math.random() < 0.15) await sleep(rnd(3000, 6500));
  if (Math.random() < 0.18) { await glide(-rnd(120, 380)); await sleep(rnd(500, 1400)); }
}

export const waitFor = async (fn, ms = 10000) => {
  for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(300)) { const v = fn(); if (v) return v; }
  return null;
};

export const click = async (el) => {
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  await sleep(rnd(400, 900));
  el.click();
};
