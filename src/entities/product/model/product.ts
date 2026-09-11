export type Currency = 'RUB'

export type Money = {
  amountMinor: number
  currency: Currency
}

export type FitWidth = 'narrow' | 'standard' | 'wide' | 'extra_wide' | 'unknown'
export type Cushioning = 'firm' | 'balanced' | 'soft' | 'unknown'
export type Support = 'flexible' | 'balanced' | 'structured' | 'unknown'
export type FitNote = 'runs_small' | 'true_to_size' | 'runs_large' | 'unknown'
export type DataProvenance = 'manufacturer' | 'editorial_demo' | 'unknown'

export type Product = {
  id: string
  slug: string
  brand: {
    id: string
    slug: string
    name: string
  }
  category: {
    id: string
    slug: string
    name: string
  }
  model: string
  title: string
  description: string
  price: Money
  compareAtPrice?: Money
  defaultVariant: {
    id: string
    slug: string
    color: {
      slug: string
      name: string
      code: string
    }
  }
  image: {
    src: string
    srcSet?: string
    alt: string
    width: number
    height: number
  }
  fit: {
    width: FitWidth
    cushioning: Cushioning
    support: Support
    note: FitNote
    provenance: DataProvenance
    sourceNote?: string
    reviewedAt?: string
  }
  useCases: readonly {
    slug: string
    label: string
  }[]
  availableSizes: readonly string[]
  availability: {
    inStock: boolean
    totalStock: number
  }
}

export type ProductMedia = {
  id: string
  kind: 'catalog' | 'gallery'
  src: string
  srcSet?: string
  alt: string
  width: number
  height: number
  position: number
}

export type InventoryItem = {
  inventoryId: string
  sku: string
  stock: number
  sizeId: string
  sizeLabel: string
  sizeValue: number
  sortOrder: number
}

export type ProductVariant = {
  id: string
  slug: string
  color: { slug: string; name: string; code: string }
  price: Money
  compareAtPrice?: Money
  isDefault: boolean
  media: readonly ProductMedia[]
  inventory: readonly InventoryItem[]
}

export type SizeGuideEntry = {
  sizeId: string
  sizeLabel: string
  sizeValue: number
  sortOrder: number
  footLengthMinMm?: number
  footLengthMaxMm?: number
  provenance: DataProvenance
  sourceNote?: string
  reviewedAt?: string
}

export type ProductDetails = Omit<
  Product,
  | 'price'
  | 'compareAtPrice'
  | 'defaultVariant'
  | 'image'
  | 'availableSizes'
  | 'availability'
> & {
  variants: readonly ProductVariant[]
  sizeGuide: readonly SizeGuideEntry[]
}
