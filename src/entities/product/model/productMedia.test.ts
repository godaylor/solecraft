import { describe, expect, it } from 'vitest'

import { resolveProductImageAsset } from './productMedia'

describe('resolveProductImageAsset', () => {
  it('maps the ten legacy catalog paths to generated responsive Solecraft assets', () => {
    expect(resolveProductImageAsset('/img/sneakers/1.png', 266, 224)).toEqual({
      src: '/media/products/solecraft-01.webp',
      srcSet:
        '/media/products/solecraft-01-600.webp 600w, /media/products/solecraft-01.webp 1200w',
      width: 1200,
      height: 900,
    })
    expect(resolveProductImageAsset('/img/sneakers/10.png', 266, 224).src).toBe(
      '/media/products/solecraft-10.webp',
    )
  })

  it('adds the responsive derivative to current generated asset paths', () => {
    expect(
      resolveProductImageAsset('/media/products/solecraft-06.webp', 1200, 900),
    ).toEqual({
      src: '/media/products/solecraft-06.webp',
      srcSet:
        '/media/products/solecraft-06-600.webp 600w, /media/products/solecraft-06.webp 1200w',
      width: 1200,
      height: 900,
    })
  })

  it('preserves non-legacy media without inventing responsive variants', () => {
    expect(resolveProductImageAsset('/uploads/product.webp', 1600, 1200)).toEqual({
      src: '/uploads/product.webp',
      width: 1600,
      height: 1200,
    })
  })
})
