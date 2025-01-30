import { UccAddToCartButtonApi } from "../apis/ucc-add-to-cart-button.api.ts";
import { UccBaseProcessor } from "./ucc-base.processor.ts";

const _addToCartButtonProcessor = new UccBaseProcessor<UccAddToCartButtonApi>();

export const processAddToCartButtons = (host: HTMLElement) => {
    _addToCartButtonProcessor.process(host, ".ucc-add-to-cart", (el) => new UccAddToCartButtonApi(el));
}