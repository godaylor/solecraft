export type CartLineInput = {
  inventoryId: string
  sku: string
  quantity: number
  maxQuantity?: number
}

export interface CartHandoff {
  add(input: CartLineInput): void
}
