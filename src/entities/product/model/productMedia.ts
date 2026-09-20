export type ProductImageAsset = {
  src: string
  srcSet?: string
  width: number
  height: number
}

const legacyProductAsset = /^\/img\/sneakers\/(10|[1-9])\.png$/
const currentProductAsset =
  /^\/media\/products\/solecraft-(0[1-9]|10)(?:-[a-z][a-z-]*)?\.webp$/

export function resolveProductImageAsset(
  src: string,
  width: number,
  height: number,
): ProductImageAsset {
  const legacyMatch = legacyProductAsset.exec(src)
  const currentMatch = currentProductAsset.exec(src)
  if (!legacyMatch && !currentMatch) return { src, width, height }

  const assetNumber = legacyMatch?.[1]?.padStart(2, '0')
  const base = legacyMatch
    ? `/media/products/solecraft-${assetNumber}`
    : src.slice(0, -'.webp'.length)

  return {
    src: `${base}.webp`,
    srcSet: `${base}-600.webp 600w, ${base}.webp 1200w`,
    width: 1200,
    height: 900,
  }
}
