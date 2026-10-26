// What the scraper-health check opens per site. `secret` = env var holding a Playwright storageState
// (JSON) for sites that need a login; without it that site is skipped, not failed.
export const PROBES = {
  reddit: { url: 'https://www.reddit.com/r/webdev/' },
  youtube: { url: 'https://www.youtube.com/results?search_query=blender+tutorial' },
  x: { url: 'https://x.com/home', secret: 'X_STATE' },
  linkedin: { url: 'https://www.linkedin.com/feed/', secret: 'LINKEDIN_STATE' },
  instagram: { url: 'https://www.instagram.com/', secret: 'INSTAGRAM_STATE' },
}

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
