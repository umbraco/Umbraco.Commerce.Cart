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
    sku: string
    productReference: string
    productVariantReference?: string
    title: string
    quantity: number
    price: FormattedPrice
    properties?: Record<string, string>
}

export type FormattedPrice = {
    value: string
    tax: string
    withoutTax: string
}