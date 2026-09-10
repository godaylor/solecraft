import type { Product } from '../model/product'

export type CatalogSort = 'recommended' | 'newest' | 'price-asc' | 'price-desc'

export type CatalogPageParams = {
  q?: string
  brands: readonly string[]
  uses: readonly string[]
  size?: string
  width?: Product['fit']['width']
  colors: readonly string[]
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  sort: CatalogSort
  page: number
  pageSize: number
}

export type CatalogRequestOptions = {
  signal?: AbortSignal
}

export type CatalogPage = {
  products: readonly Product[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CatalogErrorKind = 'backend' | 'malformed'

export class CatalogRepositoryError extends Error {
  readonly kind: CatalogErrorKind
  readonly retryable: boolean

  constructor(kind: CatalogErrorKind, message: string, retryable: boolean) {
    super(message)
    this.name = 'CatalogRepositoryError'
    this.kind = kind
    this.retryable = retryable
  }
}

export interface CatalogRepository {
  list(params: CatalogPageParams, options?: CatalogRequestOptions): Promise<CatalogPage>
}
