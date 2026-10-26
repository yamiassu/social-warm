// Renders assets/icon.svg to the extension icons and Chrome Web Store promo images.
import sharp from 'sharp'
import fs from 'node:fs'

const svg = fs.readFileSync('assets/icon.svg')
fs.mkdirSync('public/icons', { recursive: true })
fs.mkdirSync('store', { recursive: true })

for (const s of [16, 32, 48, 128]) {
  await sharp(svg, { density: 384 }).resize(s, s).png().toFile(`public/icons/icon-${s}.png`)
}

const inner = svg.toString().replace(/<svg[^>]*>|<\/svg>/g, '')
const tile = (w, h) => {
  const s = h * 0.46, x = w * 0.08, y = (h - s) / 2, tx = x + s + h * 0.07
  const f = 'font-family="Segoe UI, Arial, sans-serif"'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
<defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d0f17"/><stop offset="1" stop-color="#241a52"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#p)"/>
<g transform="translate(${x},${y}) scale(${s / 128})">${inner}</g>
<text x="${tx}" y="${h / 2}" ${f} font-weight="700" font-size="${h * 0.11}" fill="#e8eaf2">Social Warm-Up</text>
<text x="${tx}" y="${h / 2 + h * 0.13}" ${f} font-size="${h * 0.062}" fill="#9aa1ba">Warm up before you post.</text>
</svg>`
}
await sharp(Buffer.from(tile(440, 280))).png().toFile('store/promo-small-440x280.png')
await sharp(Buffer.from(tile(1400, 560))).png().toFile('store/promo-marquee-1400x560.png')
console.log('icons + promo images written')
