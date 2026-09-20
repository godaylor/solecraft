import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { chromium } from '@playwright/test'

const [inputPath, outputStem] = process.argv.slice(2)

if (!inputPath || !outputStem) {
  throw new Error(
    'Usage: node scripts/optimize-colorway-asset.mjs <input.png> <output-stem>',
  )
}

const source = await readFile(resolve(inputPath))
const browser = await chromium.launch({ channel: 'chrome', headless: true })

try {
  const page = await browser.newPage()
  const sourceUrl = `data:image/png;base64,${source.toString('base64')}`

  for (const [width, height, suffix] of [
    [1200, 900, ''],
    [600, 450, '-600'],
  ]) {
    const dataUrl = await page.evaluate(
      async ({ sourceUrl, width, height }) => {
        const image = new globalThis.Image()
        image.src = sourceUrl
        await image.decode()

        const canvas = globalThis.document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas 2D context is unavailable')

        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
        const drawWidth = image.naturalWidth * scale
        const drawHeight = image.naturalHeight * scale
        context.drawImage(
          image,
          (width - drawWidth) / 2,
          (height - drawHeight) / 2,
          drawWidth,
          drawHeight,
        )
        return canvas.toDataURL('image/webp', 0.86)
      },
      { sourceUrl, width, height },
    )

    const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1)
    await writeFile(
      resolve(`${outputStem}${suffix}.webp`),
      Buffer.from(encoded, 'base64'),
    )
  }
} finally {
  await browser.close()
}
