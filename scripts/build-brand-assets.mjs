import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { chromium } from '@playwright/test'

const sourcePath = resolve('content/brand/solecraft-emblem-source.png')
const outputPath = resolve('public/brand')
const sourceUrl = `data:image/png;base64,${(await readFile(sourcePath)).toString('base64')}`
await mkdir(outputPath, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage()
  const assets = await page.evaluate(async (url) => {
    const image = new globalThis.Image()
    image.src = url
    await image.decode()
    const sourceCanvas = globalThis.document.createElement('canvas')
    sourceCanvas.width = image.naturalWidth
    sourceCanvas.height = image.naturalHeight
    const sourceContext = sourceCanvas.getContext('2d')
    sourceContext.drawImage(image, 0, 0)
    const pixels = sourceContext.getImageData(
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    ).data
    let transparent = 0
    let opaque = 0
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) transparent += 1
      if (pixels[index] === 255) opaque += 1
    }
    if (!transparent || !opaque || pixels[3] !== 0) {
      throw new Error('The source emblem must have genuine transparent alpha')
    }

    const result = []
    for (const [size, format, name] of [
      [96, 'webp', 'solecraft-emblem-96.webp'],
      [192, 'webp', 'solecraft-emblem-192.webp'],
      [384, 'webp', 'solecraft-emblem-384.webp'],
      [32, 'png', 'favicon-32.png'],
      [64, 'png', 'favicon-64.png'],
      [180, 'png', 'apple-touch-icon.png'],
      [192, 'png', 'icon-192.png'],
      [512, 'png', 'icon-512.png'],
    ]) {
      const canvas = globalThis.document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, size, size)
      result.push({ name, dataUrl: canvas.toDataURL(`image/${format}`, 0.92) })
    }
    return {
      result,
      transparency: {
        transparent,
        opaque,
        width: image.naturalWidth,
        height: image.naturalHeight,
      },
    }
  }, sourceUrl)

  for (const { name, dataUrl } of assets.result) {
    const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
    await writeFile(resolve(outputPath, name), buffer)
    console.log(`${name}: ${buffer.length} bytes`)
  }
  console.log(JSON.stringify(assets.transparency))

  const emblemUrl = `data:image/webp;base64,${(await readFile(resolve(outputPath, 'solecraft-emblem-384.webp'))).toString('base64')}`
  const socialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Solecraft — городские кроссовки">
  <rect width="1200" height="630" fill="#111A28"/>
  <text x="80" y="120" fill="#9BB6FF" font-family="Arial, sans-serif" font-size="18" font-weight="600" letter-spacing="4">ГОРОДСКИЕ КРОССОВКИ</text>
  <text x="72" y="277" fill="#F3F6FA" font-family="Arial, sans-serif" font-size="116" font-weight="800" letter-spacing="-6">Solecraft</text>
  <text x="80" y="356" fill="#F3F6FA" font-family="Arial, sans-serif" font-size="40" font-weight="600">Твой город. Твой ритм.</text>
  <text x="80" y="414" fill="#AFBDD0" font-family="Arial, sans-serif" font-size="24">Пара, в которой хочется идти дальше.</text>
  <path d="M80 526h1040" stroke="#44536B" stroke-width="2"/>
  <circle cx="92" cy="568" r="6" fill="#FF7A45"/>
  <text x="116" y="575" fill="#AFBDD0" font-family="Arial, sans-serif" font-size="18">Без реальных списаний · демо-магазин</text>
  <image href="${emblemUrl}" x="740" y="90" width="410" height="410"/>
</svg>
`
  await writeFile(resolve('public/social-card.svg'), socialSvg)
  const socialPng = await page.evaluate(async (svg) => {
    const image = new globalThis.Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    await image.decode()
    const canvas = globalThis.document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 630
    canvas.getContext('2d').drawImage(image, 0, 0)
    return canvas.toDataURL('image/png')
  }, socialSvg)
  await writeFile(
    resolve('public/social-card.png'),
    Buffer.from(socialPng.split(',')[1], 'base64'),
  )
} finally {
  await browser.close()
}
