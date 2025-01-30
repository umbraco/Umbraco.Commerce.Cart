import { UccCartButtonApi } from "../apis/ucc-cart-button.api.ts";
import { UccBaseProcessor } from "./ucc-base.processor.ts";

const _cartButtonProcessor = new UccBaseProcessor<UccCartButtonApi>();

export const processCartButtons = (host: HTMLElement) => {
    _cartButtonProcessor.process(host, ".ucc-cart", (el) => new UccCartButtonApi(el));
}