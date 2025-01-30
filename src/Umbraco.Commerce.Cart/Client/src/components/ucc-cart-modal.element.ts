import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { Cart, CartConfig, CartItem } from "../types.ts";
import { UccModalElement } from "./ucc-modal.element.ts";
import { debounce, delegate } from "../utils.ts";
import { UccCartRepository } from "../repositories/cart.respository.ts";
import { UccEvent } from "../events/ucc.event.ts";

export class UccCartModalElement extends UccModalElement
{
    private _context = UCC_CART_CONTEXT;
    private _cartRepository = new UccCartRepository();
    
    private get storeIdOrAlias() {
        return this._context.config.get()!.store!;
    }
    
    private get cart() {
        return this._context.cart.get()!;
    }
    
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
                this._host.querySelector<HTMLElement>('.ucc-cart-total--taxes .ucc-cart-total-label')!.textContent = config.locales![config.lang].taxes;
                this._host.querySelector<HTMLElement>('.ucc-cart-total--shipping .ucc-cart-total-label')!.textContent = config.locales![config.lang].shipping;
                this._host.querySelector<HTMLElement>('.ucc-cart-total--shipping .ucc-cart-total-value')!.textContent = config.locales![config.lang].shipping_message;
                this._host.querySelector<HTMLElement>('.ucc-cart-total--total .ucc-cart-total-label')!.textContent = config.locales![config.lang].total;
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.textContent = config.locales![config.lang].checkout;
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.setAttribute('href', config.checkoutUrl!);
            }
        });
        this._context.cart.subscribe((cart: Cart) => {
            if (cart && cart.items.length > 0) {
                this._host.querySelector('.ucc-cart-items')!.innerHTML = cart.items.map((item) => `
                    <div class="ucc-cart-item" data-id="${ item.id }">
                        ${item.imageUrl ? `
                            <figure class="ucc-cart-item__image">
                                <img src="${item.imageUrl}" alt="${item.name}">
                            </figure>` : ''}
                        <div class="ucc-cart-item__body">
                            <div class="ucc-cart-item__content ucc-split">
                                <div class="ucc-split__left">
                                    <h3 class="ucc-cart-item__title">${item.name}</h3>
                                    ${item.attributes ? `
                                        <div class="ucc-cart-item__attributes">
                                            ${Object.keys(item.attributes).map((key) => `
                                                <div class="ucc-cart-item__attribute">
                                                    <span class="ucc-cart-item__attribute-key">${key}</span>
                                                    <span class="ucc-cart-item__attribute-value">${item.attributes![key]}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="ucc-split__right">
                                    <button class="ucc-cart-item__delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                                </div>
                            </div>
                            <div class="ucc-cart-item__foot ucc-split ucc-split--center">
                                <div class="ucc-split__left">
                                    <input type="number" value="${item.quantity}" min="1" class="ucc-cart-item__quantity">
                                </div>
                                <div class="ucc-split__right">
                                    <span class="ucc-cart-item__price">${item.total.withTax}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.style.display = '';
                this._host.querySelector<HTMLElement>('.ucc-cart-total--taxes .ucc-cart-total-value')!.textContent = cart.subtotal.tax;
                this._host.querySelector<HTMLElement>('.ucc-cart-total--total .ucc-cart-total-value')!.textContent = cart.subtotal.withTax;
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.classList.remove('ucc-cart-checkout--disabled');
            } else {
                this._host.querySelector<HTMLElement>('.ucc-cart-items')!.textContent = 'Cart is empty';
                this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.style.display = 'none';
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.classList.add('ucc-cart-checkout--disabled');
            }
        });
    }
    
    private _addCartItemEventListener = (event:string, selector:string, handler:Function) => {
        delegate(this._host, selector, event, (e:Event) => {
            const el = (e.target as Element).closest('.ucc-cart-item')!;
            const id = el.getAttribute('data-id');
            const item = this.cart!.items.find((item) => item.id === id);
            handler(item, el, id);
        });
    }
    
    private _attachCartTemplate() {
        this.setBody(`
            <div class="ucc-cart-items"></div>
        `)
        this.setFooter(`
            <div class="ucc-cart-totals">
                <div class="ucc-cart-totals__item ucc-cart-total ucc-cart-total--taxes ucc-split">
                    <span class="ucc-cart-total-label ucc-split__left"></span>
                    <span class="ucc-cart-total-value ucc-split__right"></span>
                </div>
                <div class="ucc-cart-totals__item ucc-cart-total ucc-cart-total--shipping ucc-split">
                    <span class="ucc-cart-total-label ucc-split__left"></span>
                    <span class="ucc-cart-total-value ucc-split__right"></span>
                </div>
                <div class="ucc-cart-totals__item ucc-cart-total ucc-cart-total--total ucc-split">
                    <span class="ucc-cart-total-label ucc-split__left"></span>
                    <span class="ucc-cart-total-value ucc-split__right"></span>
                </div>
            </div>
            <a class="ucc-cart-checkout" href="#">Checkout</a>
        `)
        
        // Listen for cart item events
        const deleteItem = async (item:CartItem) => {
            await this._cartRepository.removeItem(this.storeIdOrAlias, item.id).then(() => {
                this._host.dispatchEvent(new UccEvent(UccEvent.CART_CHANGED));
            });
        }
        this._addCartItemEventListener('click', '.ucc-cart-item__delete', deleteItem);
        
        const updateQuantity = debounce(async (item:CartItem, el: Element) => {
            const quantity = parseFloat(el.querySelector<HTMLInputElement>('.ucc-cart-item__quantity')!.value);
            await this._cartRepository.updateItem(this.storeIdOrAlias,  item.id, { quantity }).then(() => {
                this._host.dispatchEvent(new UccEvent(UccEvent.CART_CHANGED));
            });
        }, 500);
        this._addCartItemEventListener('change', '.ucc-cart-item__quantity', updateQuantity);
        
        // Block checkout if cart is empty
        this._host.querySelector('.ucc-cart-checkout')!.addEventListener('click', (e) => {
            if (this._host.querySelector('.ucc-cart-checkout')!.classList.contains('ucc-cart-checkout--disabled')) {
                e.preventDefault();
            }
        });
    }
}