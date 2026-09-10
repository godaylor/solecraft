import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const distRoot = new URL('../dist/', import.meta.url)
const manifestPath = new URL('../dist/.vite/manifest.json', import.meta.url)
const reportPath = new URL('../test-results/m10/bundle-budget.json', import.meta.url)
const budgets = {
  initialJavaScriptGzipBytes: 200 * 1024,
  initialCssGzipBytes: 40 * 1024,
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const entryKeys = Object.entries(manifest)
  .filter(([, chunk]) => chunk.isEntry)
  .map(([key]) => key)

if (entryKeys.length === 0) {
  throw new Error('Vite manifest contains no entry chunk. Run npm run build first.')
}

const javascriptFiles = new Set()
const cssFiles = new Set()

function collectStaticDependencies(key) {
  const chunk = manifest[key]
  if (!chunk) throw new Error(`Missing manifest chunk: ${key}`)
  if (chunk.file.endsWith('.js')) javascriptFiles.add(chunk.file)
  for (const cssFile of chunk.css ?? []) cssFiles.add(cssFile)
  for (const importedKey of chunk.imports ?? []) collectStaticDependencies(importedKey)
}

for (const entryKey of entryKeys) collectStaticDependencies(entryKey)

async function gzipBytes(relativePath) {
  return gzipSync(await readFile(new URL(relativePath, distRoot)), { level: 9 })
    .byteLength
}

async function summarize(files) {
  const details = await Promise.all(
    [...files].sort().map(async (file) => ({ file, gzipBytes: await gzipBytes(file) })),
  )
  return {
    gzipBytes: details.reduce((total, item) => total + item.gzipBytes, 0),
    files: details,
  }
}

const initialJavaScript = await summarize(javascriptFiles)
const initialCss = await summarize(cssFiles)
const assetNames = await readdir(new URL('../dist/assets/', import.meta.url))
const lazyJavaScript = await summarize(
  assetNames
    .filter((name) => name.endsWith('.js'))
    .map((name) => `assets/${name}`)
    .filter((name) => !javascriptFiles.has(name)),
)

const report = {
  generatedAt: new Date().toISOString(),
  projectRoot,
  budgets,
  initialJavaScript,
  initialCss,
  lazyJavaScript,
}

await mkdir(new URL('../test-results/m10/', import.meta.url), { recursive: true })
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const toKib = (bytes) => (bytes / 1024).toFixed(2)
console.log(
  `Initial JavaScript: ${toKib(initialJavaScript.gzipBytes)} KiB gzip / ${toKib(budgets.initialJavaScriptGzipBytes)} KiB`,
)
console.log(
  `Initial CSS: ${toKib(initialCss.gzipBytes)} KiB gzip / ${toKib(budgets.initialCssGzipBytes)} KiB`,
)

const failures = []
if (initialJavaScript.gzipBytes > budgets.initialJavaScriptGzipBytes) {
  failures.push('Initial JavaScript exceeds 200 KiB gzip')
}
if (initialCss.gzipBytes > budgets.initialCssGzipBytes) {
  failures.push('Initial CSS exceeds 40 KiB gzip')
}
if (failures.length > 0) throw new Error(failures.join('; '))
