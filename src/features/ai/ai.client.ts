import { chat, streamToText } from '@tanstack/ai'
import { createOpenRouterText } from '@tanstack/ai-openrouter'
import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'
import { baseUrlOf, type AiCfg } from './ai.model'

// provider hosts are optional permissions: ask once, on the user's click
async function ensureAccess(cfg: AiCfg) {
  const origins = [`${new URL(baseUrlOf(cfg)).origin}/*`]
  if (await chrome.permissions.contains({ origins })) return
  if (!(await chrome.permissions.request({ origins }))) throw new Error(`Access to ${origins[0]} was not granted.`)
}

function adapter(cfg: AiCfg) {
  if (cfg.provider === 'openrouter') return createOpenRouterText(cfg.model.trim() as any, cfg.apiKey.trim())
  return openaiCompatibleText(cfg.model.trim(), {
    baseURL: baseUrlOf(cfg),
    apiKey: cfg.apiKey.trim() || 'local', // local servers ignore it but the SDK wants a value
    api: 'chat-completions',
    dangerouslyAllowBrowser: true, // extension page; the key never leaves this browser except to the chosen provider
  })
}

// image URLs listed in the prompt document (likes + replies), capped
function imageUrls(prompt: string): string[] {
  try {
    const doc = JSON.parse(prompt)
    const urls = [...(doc.likes ?? []), ...(doc.replies ?? [])].flatMap((p: { images?: string[] }) => p.images ?? [])
    return [...new Set<string>(urls)].slice(0, 8)
  } catch { return [] } // edited into non-JSON: send as plain text
}

// local servers can't fetch remote URLs, so inline the picture as base64
async function inline(url: string) {
  const blob = await (await fetch(url)).blob()
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return { type: 'data', value: btoa(bin), mimeType: blob.type || 'image/jpeg' }
}

async function content(cfg: AiCfg, prompt: string) {
  const urls = cfg.vision ? imageUrls(prompt) : []
  if (!urls.length) return prompt
  const images = await Promise.all(urls.map(async (url) => {
    try { return { type: 'image', source: cfg.provider === 'local' ? await inline(url) : { type: 'url', value: url } } } catch { return null }
  }))
  return [{ type: 'text', content: prompt }, ...images.filter(Boolean)]
}

export async function runPrompt(cfg: AiCfg, prompt: string): Promise<string> {
  await ensureAccess(cfg)
  const stream = chat({ adapter: adapter(cfg), messages: [{ role: 'user', content: await content(cfg, prompt) }] } as any) as any
  return (await streamToText(stream)).text
}
