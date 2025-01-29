import { UccAddToCartButtonApi } from "../apis/ucc-add-to-cart-button.api.ts";

const _apiMap  = new WeakMap<HTMLElement, UccAddToCartButtonApi>();

export const processAddToCartButtons = (host: HTMLElement) => {

    const addEls = host.querySelectorAll(".uc-add-to-cart");
    for (let i = 0; i < addEls.length; i++) {
        const el = addEls[i] as HTMLElement;
        if (!_apiMap.has(el)) {
            _apiMap.set(el, new UccAddToCartButtonApi(el)); 
        }
    }

}