import { spawnSync } from 'node:child_process'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { deploymentEnvironment, vercelOutputConfig } from './deploy-config.mjs'

// Deliberately read hosted settings from process.env, never fall back to .env.local.
const { origin } = deploymentEnvironment(process.env)
const root = fileURLToPath(new URL('..', import.meta.url))
for (const [script, args] of [
  ['../node_modules/typescript/bin/tsc', ['-b']],
  ['../node_modules/vite/bin/vite.js', ['build']],
  ['./check-bundle-budget.mjs', []],
]) {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL(script, import.meta.url)), ...args],
    {
      cwd: root,
      stdio: 'inherit',
    },
  )
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
const output = new URL('../.vercel/output/', import.meta.url)
await mkdir(new URL('static/', output), { recursive: true })
await cp(new URL('../dist/', import.meta.url), new URL('static/', output), {
  recursive: true,
})
await writeFile(
  new URL('config.json', output),
  JSON.stringify(vercelOutputConfig(origin), null, 2) + '\n',
)
console.log('Vercel Build Output prepared with exact cloud-origin CSP')
