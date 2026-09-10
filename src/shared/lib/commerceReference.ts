/** Display alias only. Persisted identifiers, links and API lookups stay unchanged. */
export function commerceReference(value: string): string {
  return value.replace(/^PARA-/, 'SOLECRAFT-')
}
