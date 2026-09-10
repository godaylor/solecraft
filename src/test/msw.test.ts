import { describe, expect, it } from 'vitest'

describe('MSW harness', () => {
  it('intercepts deterministic test requests', async () => {
    const response = await fetch('http://localhost/api/health')
    const body: unknown = await response.json()

    expect(body).toEqual({ status: 'ok' })
  })
})
