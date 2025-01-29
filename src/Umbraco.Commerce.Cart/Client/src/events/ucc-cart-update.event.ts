import { Cart } from "../types.ts";

export class UccCartUpdateEvent extends Event {

    public static readonly TYPE = 'ucc-cart-update';
    
    public cart: Cart;
    
    constructor(cart: Cart) {
        super(UccCartUpdateEvent.TYPE, { bubbles: true, composed: true });
        this.cart = cart;
    }
}