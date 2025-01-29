import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { Cart, CartConfig } from "../types.ts";
import { UccModalElement } from "./ucc-modal.element.ts";

export class UccCartModalElement extends UccModalElement
{
    private _context = UCC_CART_CONTEXT;
    
    constructor(host: HTMLElement) {
        super(host);
        this._attachCartTemplate();
        this._observerContext();
    }
    
    private _observerContext = () => {
        this._context.config.subscribe((config: CartConfig) => {
            if (config) {
                this.setTitle(config.locales![config.lang].cart_title);
                this.setCloseButtonLabel(config.locales![config.lang].close_cart);
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-total--taxes .ucc-cart-modal-total-label')!.textContent = config.locales![config.lang].taxes;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-total--shipping .ucc-cart-modal-total-label')!.textContent = config.locales![config.lang].shipping;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-total--shipping .ucc-cart-modal-total-value')!.textContent = config.locales![config.lang].shipping_message;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-total--total .ucc-cart-modal-total-label')!.textContent = config.locales![config.lang].total;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-checkout')!.textContent = config.locales![config.lang].checkout;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-checkout')!.setAttribute('href', config.checkoutUrl!);
            }
        });
        this._context.cart.subscribe((cart: Cart) => {
            if (cart && cart.items.length > 0) {
                this._host.querySelector('.ucc-cart-modal-items')!.innerHTML = cart.items.map((item) => `
                    <div class="ucc-cart-modal-item">
                        <div class="ucc-cart-modal-item__image">
                            
                        </div>
                        <div class="ucc-cart-modal-item__details">
                            <div class="ucc-cart-modal-item__title">${item.title}</div>
                            <div class="ucc-cart-modal-item__price">${item.price.value}</div>
                            <div class="ucc-cart-modal-item__quantity">${item.quantity}</div>
                        </div>
                    </div>
                `).join('');
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-totals')!.style.display = '';
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-total--taxes .ucc-cart-modal-total-value')!.textContent = cart.subtotal.tax;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-total--total .ucc-cart-modal-total-value')!.textContent = cart.subtotal.value;
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-checkout')!.classList.remove('ucc-cart-modal-checkout--disabled');
            } else {
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-items')!.textContent = 'Cart is empty';
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-totals')!.style.display = 'none';
                this._host.querySelector<HTMLElement>('.ucc-cart-modal-checkout')!.classList.add('ucc-cart-modal-checkout--disabled');
            }
        });
    }
    
    private _attachCartTemplate() {
        this.setBody(`
            <div class="ucc-cart-modal-items"></div>
        `)
        this.setFooter(`
            <div class="ucc-cart-modal-totals">
                <div class="ucc-cart-modal-totals__item ucc-cart-modal-total ucc-cart-modal-total--taxes">
                    <span class="ucc-cart-modal-total-label"></span>
                    <span class="ucc-cart-modal-total-value"></span>
                </div>
                <div class="ucc-cart-modal-totals__item ucc-cart-modal-total ucc-cart-modal-total--shipping">
                    <span class="ucc-cart-modal-total-label"></span>
                    <span class="ucc-cart-modal-total-value"></span>
                </div>
                <div class="ucc-cart-modal-totals__item ucc-cart-modal-total ucc-cart-modal-total--total">
                    <span class="ucc-cart-modal-total-label"></span>
                    <span class="ucc-cart-modal-total-value"></span>
                </div>
            </div>
            <a class="ucc-cart-modal-checkout" href="#">Checkout</a>
        `)
        this._host.querySelector('.ucc-cart-modal-checkout')!.addEventListener('click', (e) => {
            if (this._host.querySelector('.ucc-cart-modal-checkout')!.classList.contains('ucc-cart-modal-checkout--disabled')) {
                e.preventDefault();
            }
        });
    }
    
    render() {
        super.render();
    }
}