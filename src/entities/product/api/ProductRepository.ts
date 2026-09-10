import type { ProductDetails } from '../model/product'

export type ProductRepositoryErrorKind = 'not-found' | 'backend' | 'malformed'

export class ProductRepositoryError extends Error {
  readonly kind: ProductRepositoryErrorKind
  readonly retryable: boolean

  constructor(kind: ProductRepositoryErrorKind, message: string, retryable: boolean) {
    super(message)
    this.name = 'ProductRepositoryError'
    this.kind = kind
    this.retryable = retryable
  }
}

export interface ProductRepository {
  getBySlug(slug: string, options?: { signal?: AbortSignal }): Promise<ProductDetails>
}
