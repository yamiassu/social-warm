# Privacy Policy — Social Warm-Up

_Last updated: 2026-10-26_

Social Warm-Up does not collect, transmit, sell or share any personal data. It has no server, no analytics and no accounts. The only time data leaves your device is the optional "Run with AI" feature described below, and only to a provider you configure yourself.

**What it reads.** When you press "Start gathering" on X, Reddit, LinkedIn, Instagram or YouTube, the extension reads publicly visible post text, author handles, links and like/reply counts on the page you are viewing, and whether an author's hover card shows Follow or Following.

**Where it goes.** This information stays on your device. It is stored in the browser's local extension storage (`chrome.storage.local`) together with your settings and base prompt, so it is still there next time you open the panel. It is copied to your clipboard only when you press "Copy". What you do with the copied text, such as pasting it into an AI assistant, is outside this extension.

**What it does on X.** In the Apply tab, and only after you paste a response and confirm, the extension navigates the current tab and performs the likes, replies and follows listed in that response.

**Optional AI feature.** If you add an API key (OpenRouter or OpenAI) or a local model URL in Settings, pressing "Run with AI" or "Test connection" sends the generated prompt (post text, handles and image links you gathered, plus your base prompt, and the images themselves if you turn on "Send post images") directly from your browser to that provider. Nothing goes through our servers; we have none. Your key is stored in local extension storage (not encrypted) and sent only to that provider. The extension asks for permission to reach the provider host the first time you use it.

**Permissions.** `storage` (save your settings and last result), `sidePanel` (show the panel), `scripting` (re-inject the page script into tabs that were open before installation), and host access to the supported sites (`x.com`, `twitter.com`, `www.reddit.com`, `www.linkedin.com`, `www.instagram.com`, `www.youtube.com`) to read the page and perform the actions you approve, and `pbs.twimg.com` (X's image host, to read post pictures when you enable image sending to a local model), and optional host access requested only for the AI provider you configure.

**Remote code.** None. All code ships inside the extension package.

**Deleting your data.** Remove the extension, or clear its site data in `chrome://extensions`.

Contact: rafael.chaves98@hotmail.com
