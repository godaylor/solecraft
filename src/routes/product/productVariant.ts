import type {
  ProductDetails,
  ProductVariant,
} from '../../entities/product/model/product'

export function resolveProductVariant(
  product: ProductDetails,
  colorSlug: string | null,
): { variant: ProductVariant; canonicalColor: string | null } {
  const defaultVariant = product.variants.find((variant) => variant.isDefault)!
  if (!colorSlug) return { variant: defaultVariant, canonicalColor: null }
  const requested = product.variants.find((variant) => variant.color.slug === colorSlug)
  return requested
    ? {
        variant: requested,
        canonicalColor: requested.isDefault ? null : colorSlug,
      }
    : { variant: defaultVariant, canonicalColor: null }
}
