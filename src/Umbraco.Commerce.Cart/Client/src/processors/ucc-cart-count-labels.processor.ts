import { UccBaseProcessor } from "./ucc-base.processor.ts";
import { UccCartCountLabelApi } from "../apis/ucc-cart-count-label.api.ts";

const _cartCountLabelProcessor = new UccBaseProcessor<UccCartCountLabelApi>();

export const processCartCountLabels = (host: HTMLElement) => {
    _cartCountLabelProcessor.process(host, ".ucc-cart-count", (el) => new UccCartCountLabelApi(el));
}