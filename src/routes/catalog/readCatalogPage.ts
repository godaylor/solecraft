import {
  emptyCatalogState,
  parseCatalogParams,
  serializeCatalogParams,
  type CatalogUrlState,
} from './catalogParams'

export function readCatalogPage(searchParams: URLSearchParams): number {
  return parseCatalogParams(searchParams).page
}

export function catalogPageHref(
  page: number,
  state: CatalogUrlState = emptyCatalogState,
): string {
  const query = serializeCatalogParams({ ...state, page }).toString()
  return query ? `/catalog?${query}` : '/catalog'
}
