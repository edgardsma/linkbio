/**
 * Gera ícones PNG para PWA a partir do icon.svg
 * Uso: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'public', 'icon.svg')
const svgBuffer = readFileSync(svgPath)

const icons = [
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-192-maskable.png', size: 192, padding: 24 },
  { name: 'icon-512.png',          size: 512 },
  { name: 'icon-512-maskable.png', size: 512, padding: 64 },
  { name: 'apple-touch-icon.png',  size: 180 },
]

for (const icon of icons) {
  const svgSize = icon.padding ? icon.size - icon.padding * 2 : icon.size

  let pipeline = sharp(svgBuffer).resize(svgSize, svgSize)

  if (icon.padding) {
    // Ícone maskable: fundo sólido com padding (safe zone de ~20%)
    pipeline = sharp({
      create: {
        width: icon.size,
        height: icon.size,
        channels: 4,
        background: { r: 102, g: 126, b: 234, alpha: 1 }, // #667eea
      },
    }).composite([{
      input: await sharp(svgBuffer).resize(svgSize, svgSize).png().toBuffer(),
      gravity: 'center',
    }])
  }

  const outPath = resolve(root, 'public', icon.name)
  await pipeline.png().toFile(outPath)
  console.log(`✓ ${icon.name} (${icon.size}x${icon.size})`)
}

console.log('\nÍcones gerados com sucesso!')
