import { Cart, CartConfig } from "../types.ts";
import { reactiveValue } from "../utils.ts";

export const UCC_CART_CONTEXT = {
    config: reactiveValue<CartConfig>(null),
    cart: reactiveValue<Cart>(null)
}