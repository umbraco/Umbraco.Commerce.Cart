export type ProductData = {
    productReference: string
    productVariantReference?: string
    quantity: number
    properties?: Record<string, string>
}

export type MasterProductData = ProductData & {
    bundleReference?: string
    bundleItems?: ProductData[]
}

export type AddToCartRequest = MasterProductData;
export type UpdateCartItemRequest = {
    quantity?: number
    properties?: Record<string, string>
}

export type CartConfig = {
    store?: string
    checkoutUrl?: string
    lang: string
    locales?: Record<string, Record<string, string>>
}

export type Cart = {
    id: string
    items: CartItem[]
    subtotal: FormattedPrice
}

export type CartItem = {
    id: string
    productReference: string
    productVariantReference?: string
    sku: string
    name: string
    imageUrl?: string
    unitPrice: FormattedPrice
    quantity: number
    total: FormattedPrice
    properties?: Record<string, string>
    attributes?: Record<string, string>
}

export type FormattedPrice = {
    withTax: string
    tax: string
    withoutTax: string
}