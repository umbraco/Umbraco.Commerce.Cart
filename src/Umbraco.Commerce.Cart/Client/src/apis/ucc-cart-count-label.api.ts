import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { Cart } from "../types.ts";

export class UccCartCountLabelApi {

    private readonly _host: HTMLElement;
    private readonly _context = UCC_CART_CONTEXT;

    constructor(host: HTMLElement) {
        this._host = host;
        this._observeCart();
    }
    
    private _observeCart = () =>
    {
        this._context.cart.subscribe((cart:Cart) => {
            if (cart) {
                this._host.textContent = cart.items.reduce((acc, item) => acc + item.quantity, 0).toString();
            }
        });
    }
    
}