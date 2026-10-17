import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import { mkdir, writeFile } from 'node:fs/promises'
import { assertLocalPortFree } from './assert-local-port.mjs'

// Windows fallback for chrome-launcher's EBUSY profile cleanup. Playwright owns
// this Chrome process and closes it after Lighthouse connects through its port.
// Start the real local preview on 32601 before running this measurement.
const output = process.env.LIGHTHOUSE_OUTPUT ?? '.codex-temp/redesign-performance'
await assertLocalPortFree(32602)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--remote-debugging-port=32602', '--remote-debugging-address=127.0.0.1'],
})
const reports = []
try {
  for (let run = 1; run <= 3; run++) {
    const result = await lighthouse('http://127.0.0.1:32601/', {
      port: 32602,
      hostname: '127.0.0.1',
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    })
    await writeFile(`${output}/mobile-${run}.json`, result.report)
    const { categories, audits } = result.lhr
    const summary = {
      run,
      performance: categories.performance.score,
      accessibility: categories.accessibility.score,
      lcp: audits['largest-contentful-paint'].numericValue,
      cls: audits['cumulative-layout-shift'].numericValue,
    }
    reports.push(summary)
    console.log(JSON.stringify(summary))
  }
  await writeFile(`${output}/summary.json`, JSON.stringify(reports, null, 2))
} finally {
  await browser.close()
}
const median = (key) => reports.map((report) => report[key]).sort((a, b) => a - b)[1]
if (
  median('performance') < 0.9 ||
  median('accessibility') < 0.95 ||
  median('lcp') > 2500 ||
  median('cls') > 0.1
) {
  throw new Error('The median local Lighthouse measurement exceeded a release budget')
}
