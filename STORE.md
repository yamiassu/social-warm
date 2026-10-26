# Chrome Web Store listing — Social Warm-Up

## Name
Social Warm-Up

## Summary (max 132 chars)
Warm up X, Reddit, LinkedIn, Instagram and YouTube: gather what to like, comment and follow, then apply it with human-like pacing.

## Category
Productivity

## Description
Social Warm-Up helps you get active on X, Reddit, LinkedIn, Instagram and YouTube before you post, without the busywork of hunting for the right accounts and posts.

**Gather**
- Choose what to collect and how many: likes, replies, follows.
- The extension scrolls your page like a person would (eased scrolling, random pauses, the occasional scroll back) and collects candidates.
- It checks hover cards so it only suggests accounts you are not already following.
- Edit the base prompt, then copy everything as one prompt for your AI assistant. The prompt asks for a strict JSON reply.

**Apply**
- Paste the JSON reply, with or without having gathered first.
- Every action is validated; anything invalid is ignored and shown to you.
- Try a dry run first: it finds the buttons and clicks nothing.
- Apply likes, replies and follows with human-like pauses between actions.
- If something fails, copy an error report in one click.

**Bring your own model (optional)**
- Add an OpenRouter or OpenAI key, or point to a local model (Ollama, LM Studio, vLLM), and run the generated prompt without leaving the extension. One click sends the reply to Apply.

**Private by design**
No servers, no analytics, no accounts. Everything stays in your browser.

Social Warm-Up is not affiliated with or endorsed by X Corp., Reddit, LinkedIn, Instagram or YouTube. Automated engagement can conflict with a platform's rules: use small counts, review every reply, and use it responsibly.

## Single purpose
Help the user prepare engagement (likes, replies, follows) on X from their own feed and apply an approved plan.

## Permission justifications
- **sidePanel** — the whole UI lives in the browser side panel.
- **storage** — remembers the user's settings, base prompt and last gathered result.
- **scripting** — injects the page script into an X tab that was already open when the extension was installed or updated.
- **Host access (x.com, twitter.com, reddit.com, linkedin.com, instagram.com, youtube.com)** — reads posts on the page to gather candidates and performs the like/comment/follow actions the user approves.
- **pbs.twimg.com** — X's image CDN; lets the extension download post pictures to attach them for a local vision model (only when the user turns on "Send post images").
- **Optional host access (all sites)** — requested at runtime for one origin only: the AI provider the user configures (OpenRouter, OpenAI or their local model server). Used to send the user's prompt to that provider.
- **Remote code** — none.

## Data use disclosures
- Collects: website content (public post text and handles on x.com), processed locally only.
- If the user enables the AI feature, the prompt is sent to the provider they chose, at their request only.
- Not sold, not transferred, not used for unrelated purposes, not used for creditworthiness or lending.

## Assets
- Icon: `public/icons/icon-128.png`
- Small promo tile (440×280): `store/promo-small-440x280.png`
- Marquee (1400×560): `store/promo-marquee-1400x560.png`
- Screenshots (1280×800, you must capture): Gather tab with settings; Gather result with the copy prompt; Apply tab after validation; Apply tab after a dry run.

## Submission checklist
1. `npm run zip`, then upload `social-warm.zip`.
2. Paste the summary, description and justifications above.
3. Add the privacy policy URL (host `PRIVACY.md`, for example as a GitHub Pages or gist link).
4. Upload at least one 1280×800 screenshot.
