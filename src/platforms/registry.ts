// Panel-side knowledge about each supported site (the page-side adapters live in <platform>/adapter.js).
export type PlatformId = 'x' | 'reddit' | 'linkedin' | 'instagram' | 'youtube'

export type Platform = {
  id: PlatformId
  label: string
  /** tab URLs this platform handles */
  site: RegExp
  /** a post/video URL we are willing to act on */
  post: RegExp
  /** a valid account handle */
  handle: RegExp
  profile: (handle: string) => string
  replyMax: number
  /** what the generic actions mean here */
  vocabulary: { like: string; reply: string; follow: string }
}

export const PLATFORMS: Platform[] = [
  {
    id: 'x', label: 'X', site: /^https:\/\/(x|twitter)\.com\//,
    post: /^https:\/\/(?:x|twitter)\.com\/\w{1,15}\/status\/\d+/, handle: /^\w{1,15}$/,
    profile: (h) => `https://x.com/${h}`, replyMax: 280, vocabulary: { like: 'like', reply: 'reply', follow: 'follow' },
  },
  {
    id: 'reddit', label: 'Reddit', site: /^https:\/\/(www\.|old\.)?reddit\.com\//,
    post: /^https:\/\/(?:www\.|old\.)?reddit\.com\/r\/\w+\/comments\/\w+/, handle: /^[\w-]{3,20}$/,
    profile: (h) => `https://www.reddit.com/user/${h}/`, replyMax: 1000, vocabulary: { like: 'upvote', reply: 'comment', follow: 'follow user' },
  },
  {
    id: 'linkedin', label: 'LinkedIn', site: /^https:\/\/www\.linkedin\.com\//,
    post: /^https:\/\/www\.linkedin\.com\/feed\/update\/urn:li:(?:activity|share|ugcPost):\d+/, handle: /^[\w%.-]{3,100}$/,
    profile: (h) => `https://www.linkedin.com/in/${h}/`, replyMax: 1000, vocabulary: { like: 'react (like)', reply: 'comment', follow: 'follow' },
  },
  {
    id: 'instagram', label: 'Instagram', site: /^https:\/\/www\.instagram\.com\//,
    post: /^https:\/\/www\.instagram\.com\/(?:p|reel)\/[\w-]+/, handle: /^[\w.]{1,30}$/,
    profile: (h) => `https://www.instagram.com/${h}/`, replyMax: 300, vocabulary: { like: 'like', reply: 'comment', follow: 'follow' },
  },
  {
    id: 'youtube', label: 'YouTube', site: /^https:\/\/(www\.|m\.)?youtube\.com\//,
    post: /^https:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/)[\w-]{11}/, handle: /^[\w.\-·]{3,60}$/,
    profile: (h) => `https://www.youtube.com/@${h}`, replyMax: 500, vocabulary: { like: 'like the video', reply: 'comment on the video', follow: 'subscribe' },
  },
]

export const platformOf = (url = '') => PLATFORMS.find((p) => p.site.test(url))
export const platformById = (id: PlatformId = 'x') => PLATFORMS.find((p) => p.id === id)!
export const platformByPostUrl = (url: string) => PLATFORMS.find((p) => p.post.test(url))
export const SUPPORTED_LABELS = PLATFORMS.map((p) => p.label).join(', ')
