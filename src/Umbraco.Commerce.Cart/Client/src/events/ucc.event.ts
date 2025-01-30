export class UccEvent extends Event {
    
    public static CART_CHANGED = 'ucc-cart-changed';
    public static CART_OPEN = 'ucc-cart-open';
    public static CART_CLOSE = 'ucc-cart-close';
    
    constructor(type:string) {
        super(type, { bubbles: true, composed: true });
    }
}