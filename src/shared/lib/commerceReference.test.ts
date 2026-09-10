import { expect, it } from 'vitest'
import { commerceReference } from './commerceReference'

it('brands legacy references without changing unrelated manufacturer SKUs', () => {
  expect(commerceReference('PARA-BLACK-42')).toBe('SOLECRAFT-BLACK-42')
  expect(commerceReference('SOLECRAFT-123')).toBe('SOLECRAFT-123')
  expect(commerceReference('NIKE-PARA-42')).toBe('NIKE-PARA-42')
})
