export class UccEvent extends Event {
    
    public static CART_CHANGED = 'ucc-cart-changed';
    public static CART_OPEN = 'ucc-cart-open';
    public static CART_CLOSE = 'ucc-cart-close';
    public static CART_ERROR = 'ucc-cart-error';
    
    public Detail?: any;
    
    constructor(type:string, detail?:any) {
        super(type, { bubbles: true, composed: true });
        this.Detail = detail;
    }
}