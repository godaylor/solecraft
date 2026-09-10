import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deploymentEnvironment, vercelOutputConfig } from './deploy-config.mjs'

const fixture = {
  VITE_APP_ENV: 'preview',
  VITE_SUPABASE_URL: 'https://test-fixture.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture',
}
test('rejects missing settings, localhost, insecure URLs and privileged keys', () => {
  for (const patch of [
    { VITE_APP_ENV: undefined },
    { VITE_SUPABASE_URL: undefined },
    { VITE_SUPABASE_URL: 'http://127.0.0.1:32621' },
    { VITE_SUPABASE_URL: 'https://localhost' },
    { VITE_SUPABASE_URL: 'https://test-fixture.supabase.co/other' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test_fixture' },
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'local-test-anon' },
  ])
    assert.throws(() => deploymentEnvironment({ ...fixture, ...patch }))
  assert.equal(deploymentEnvironment(fixture).origin, fixture.VITE_SUPABASE_URL)
})
test('serves actual assets before SPA fallback and scopes CSP to the supplied origin', () => {
  const config = vercelOutputConfig(fixture.VITE_SUPABASE_URL)
  assert.equal(config.version, 3)
  assert.equal(config.routes[2].handle, 'filesystem')
  assert.equal(config.routes[3].status, 404)
  assert.equal(config.routes.at(-1).dest, '/index.html')
  const csp = config.routes[0].headers['Content-Security-Policy']
  assert.ok(csp.includes("connect-src 'self' " + fixture.VITE_SUPABASE_URL))
  assert.ok(!csp.includes('localhost') && !csp.includes('https://*'))
})
