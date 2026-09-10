import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { assertLocalPortFree } from './assert-local-port.mjs'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const targetUrl = new URL(process.env.LIGHTHOUSE_URL ?? 'http://127.0.0.1:32601/')
const runCount = Number.parseInt(process.env.LIGHTHOUSE_RUNS ?? '3', 10)
const reportDirectory = new URL('../test-results/m10/', import.meta.url)
const lighthouseCli = fileURLToPath(
  new URL('../node_modules/lighthouse/cli/index.js', import.meta.url),
)
const viteCli = fileURLToPath(
  new URL('../node_modules/vite/bin/vite.js', import.meta.url),
)
const localPreview =
  ['127.0.0.1', 'localhost'].includes(targetUrl.hostname) && targetUrl.port === '32601'

if (!Number.isInteger(runCount) || runCount < 1 || runCount > 5) {
  throw new Error('LIGHTHOUSE_RUNS must be an integer from 1 to 5')
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code ?? 'unknown'}`))
    })
  })
}

async function readPreviewIdentity() {
  const response = await fetch(targetUrl.origin, { signal: AbortSignal.timeout(1_500) })
  if (!response.ok) return false
  return (await response.text()).includes('<title>Solecraft')
}

async function waitForPreview() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      if (await readPreviewIdentity()) return
    } catch {
      // The owned preview process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('Timed out waiting for the Solecraft preview on port 32601')
}

let previewProcess
if (localPreview) {
  let existingPreview
  try {
    existingPreview = await readPreviewIdentity()
  } catch {
    existingPreview = false
  }

  if (!existingPreview) {
    await assertLocalPortFree(32601)
    previewProcess = spawn(
      process.execPath,
      [viteCli, 'preview', '--host', '127.0.0.1', '--port', '32601', '--strictPort'],
      { cwd: projectRoot, stdio: 'ignore' },
    )
    await waitForPreview()
  }
}

await mkdir(reportDirectory, { recursive: true })
const reports = []

try {
  for (let index = 0; index < runCount; index += 1) {
    await assertLocalPortFree(32602)
    const outputPath = fileURLToPath(
      new URL(
        `../test-results/m10/lighthouse-mobile-${index + 1}.json`,
        import.meta.url,
      ),
    )
    await runProcess(process.execPath, [
      lighthouseCli,
      targetUrl.href,
      '--quiet',
      '--port=32602',
      '--hostname=127.0.0.1',
      '--output=json',
      `--output-path=${outputPath}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new --no-sandbox',
    ])
    const report = JSON.parse(await readFile(outputPath, 'utf8'))
    reports.push({
      run: index + 1,
      performance: report.categories.performance.score,
      accessibility: report.categories.accessibility.score,
      bestPractices: report.categories['best-practices'].score,
      seo: report.categories.seo.score,
      lcpMs: report.audits['largest-contentful-paint'].numericValue,
      cls: report.audits['cumulative-layout-shift'].numericValue,
    })
  }
} finally {
  if (previewProcess) previewProcess.kill()
}

const median = [...reports].sort((left, right) => left.performance - right.performance)[
  Math.floor(reports.length / 2)
]
const summary = {
  generatedAt: new Date().toISOString(),
  targetUrl: targetUrl.href,
  profile: 'Lighthouse default mobile simulated throttling',
  thresholds: {
    performance: 0.9,
    accessibility: 0.95,
    lcpMs: 2500,
    cls: 0.1,
  },
  median,
  runs: reports,
}

await writeFile(
  new URL('../test-results/m10/lighthouse-summary.json', import.meta.url),
  `${JSON.stringify(summary, null, 2)}\n`,
  'utf8',
)
console.log(JSON.stringify(summary, null, 2))

const failures = []
if (median.performance < summary.thresholds.performance) {
  failures.push('Performance score is below 90')
}
if (median.accessibility < summary.thresholds.accessibility) {
  failures.push('Accessibility score is below 95')
}
if (median.lcpMs > summary.thresholds.lcpMs) failures.push('LCP exceeds 2.5 seconds')
if (median.cls > summary.thresholds.cls) failures.push('CLS exceeds 0.1')
if (failures.length > 0) throw new Error(failures.join('; '))
