import { beforeEach, describe, expect, it } from 'vitest'

import { migrateStorageKey } from './storageKeys'

describe('migrateStorageKey', () => {
  beforeEach(() => localStorage.clear())

  it('copies legacy state and removes it only after the new write succeeds', () => {
    localStorage.setItem('legacy-key', '{"state":"kept"}')

    migrateStorageKey(localStorage, 'solecraft-key', ['legacy-key'])

    expect(localStorage.getItem('solecraft-key')).toBe('{"state":"kept"}')
    expect(localStorage.getItem('legacy-key')).toBeNull()
  })

  it('never overwrites current state with a legacy value', () => {
    localStorage.setItem('solecraft-key', 'current')
    localStorage.setItem('legacy-key', 'legacy')

    migrateStorageKey(localStorage, 'solecraft-key', ['legacy-key'])

    expect(localStorage.getItem('solecraft-key')).toBe('current')
    expect(localStorage.getItem('legacy-key')).toBe('legacy')
  })
})
