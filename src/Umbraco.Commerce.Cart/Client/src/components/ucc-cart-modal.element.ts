import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { CartConfig, CartItem } from "../types.ts";
import { UccModalElement } from "./ucc-modal.element.ts";
import { debounce, delegate, difference } from "../utils.ts";
import { UccCartRepository } from "../repositories/cart.respository.ts";
import { UccEvent } from "../events/ucc.event.ts";
import { localize } from "../localization.ts";

export class UccCartModalElement extends UccModalElement
{
    private _context = UCC_CART_CONTEXT;
    private _cartRepository: UccCartRepository;
    
    private get storeIdOrAlias() {
        return this._context.config.get()!.store!;
    }
    
    private get cart() {
        return this._context.cart.get()!;
    }
    
    constructor(host: HTMLElement) {
        super(host);
        this._cartRepository = new UccCartRepository(host);
        this._attachCartTemplate();
        this._observerContext();
    }
    
    private _observerContext = () => {
        this._context.config.subscribe((config: CartConfig) => {
            if (config) {
                
                // Localize UI
                
                this.setTitle(localize('cart_title'));
                this.setCloseButtonLabel(localize('close_cart'));

                this._host.querySelector<HTMLElement>('.ucc-cart-empty__message')!.textContent = localize('cart_empty');
                this._host.querySelector<HTMLElement>('.ucc-cart-total--subtotal .ucc-cart-total-label')!.textContent = localize('subtotal');
                this._host.querySelector<HTMLElement>('.ucc-cart-total--taxes .ucc-cart-total-label')!.textContent = localize('taxes');
                this._host.querySelector<HTMLElement>('.ucc-cart-total--total .ucc-cart-total-label')!.textContent = localize('total');
                this._host.querySelector<HTMLElement>('.ucc-cart-message')!.textContent = localize('shipping_and_discounts_message');
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.textContent =  localize('checkout');
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.setAttribute('href', config.checkoutUrl!);
                
                Array.from(this._host.querySelectorAll<HTMLElement>('.ucc-cart-item')).forEach((el) => {
                    
                    el.querySelector<HTMLElement>('.ucc-cart-item__remove')!.setAttribute('title',  localize('remove'));
                    
                    const basePriceEl = el.querySelector<HTMLElement>('.ucc-cart-item__bundle-item--base .ucc-cart-item__bundle-item-name');
                    if (basePriceEl) {
                        basePriceEl.textContent =  localize('base_price');
                    }
                    
                    Array.from(el.querySelectorAll<HTMLElement>('.ucc-cart-item__property')).forEach((propertyEl) => {
                        const key = propertyEl.dataset.propertyKey;
                        propertyEl.querySelector<HTMLElement>('.ucc-cart-item__property-key')!.textContent = localize(`property_${key!.toLowerCase()}`);
                    });                    
                    
                });
                
                if (config.showPricesIncludingTax) {
                    this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.classList.add('ucc-cart-totals--inc-tax');
                } else {
                    this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.classList.remove('ucc-cart-totals--inc-tax');
                }

                this._renderCart();
            }
        });
        this._context.cart.subscribe(() => {
            this._renderCart();
        });
    }
    
    private _renderCart() 
    {
        const config = this._context.config.get();
        if (!config) return;
        
        const cart = this._context.cart.get();
        if (cart && cart.items.length > 0) {
            
            // Compare cart items with DOM elements to determine what items have been added, removed or updated
            const domIds = Array.from(this._host.querySelectorAll<HTMLElement>('.ucc-cart-item')).map((el) => el.dataset.id);
            const cartIds = cart.items.map((item) => item.id);
            const { added, removed, intersects } = difference(cartIds, domIds);
            
            // Remove items that are no longer in the cart
            removed.forEach((id) => {
                this._host.querySelector<HTMLElement>(`.ucc-cart-item[data-id="${id}"]`)?.remove();
            });
            
            // Update existing items
            intersects.forEach((id) => 
            {
                const item = cart.items.find((item) => item.id === id)!;
                const el = this._host.querySelector<HTMLElement>(`.ucc-cart-item[data-id="${id}"]`)!;
                
                // NB: We assume that only quantity and price can change
                
                const qtyEl = el.querySelector<HTMLInputElement>('.ucc-cart-item__quantity')!;
                if (parseFloat(qtyEl.value) !== item.quantity) {
                    qtyEl.value = item.quantity.toString();
                }
                
                const newPrice = config.showPricesIncludingTax ? item.total.withTax : item.total.withoutTax;
                const priceEl = el.querySelector<HTMLElement>('.ucc-cart-item__price')!;
                if (priceEl.textContent !== newPrice) {
                    priceEl.textContent = newPrice;
                }
            });
            
            // Add new items to the cart
            added.forEach((id) => {
                
                const item = cart.items.find((item) => item.id === id)!;
                
                this._host.querySelector('.ucc-cart-items')!.insertAdjacentHTML('beforeend', `
                    <div class="ucc-cart-item" data-id="${ item.id }">
                        ${item.imageUrl ? `
                            <figure class="ucc-cart-item__image">
                                <img src="${item.imageUrl}" alt="${item.name}">
                            </figure>` : ''}
                        <div class="ucc-cart-item__body">
                            <div class="ucc-cart-item__content ucc-split">
                                <div class="ucc-split__left ucc-split__item--fill">
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
                                    ${item.properties ? `
                                        <div class="ucc-cart-item__properties">
                                            ${Object.keys(item.properties).map((key) => `
                                                <div class="ucc-cart-item__property" data-property-key="${key}">
                                                    <span class="ucc-cart-item__property-key">${ localize(`property_${key.toLowerCase()}`) }</span>
                                                    <span class="ucc-cart-item__property-value">${item.properties![key]}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    ${item.items && item.items.length ? `
                                        <div class="ucc-cart-item__bundle">
                                            <div class="ucc-cart-item__bundle-item ucc-cart-item__bundle-item--base">
                                                <span class="ucc-cart-item__bundle-item-name">${localize('base_price')}</span>
                                                <span class="ucc-cart-item__bundle-item-quantity"></span>
                                                <span class="ucc-cart-item__bundle-item-quantity">${config.showPricesIncludingTax ? item.basePrice.withTax : item.basePrice.withoutTax}</span>
                                            </div>
                                            ${item.items.map((bundleItem) => `
                                                    <div class="ucc-cart-item__bundle-item">
                                                        <span class="ucc-cart-item__bundle-item-name">${bundleItem.name}</span>
                                                        <span class="ucc-cart-item__bundle-item-quantity">x${bundleItem.quantity}</span>
                                                        <span class="ucc-cart-item__bundle-item-quantity">${config.showPricesIncludingTax ? bundleItem.total.withTax : bundleItem.total.withoutTax}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="ucc-split__right">
                                        <button class="ucc-cart-item__remove" title="${localize('remove')}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                                    </div>
                                </div>
                                <div class="ucc-cart-item__foot ucc-split ucc-split--center">
                                    <div class="ucc-split__left">
                                        <input type="number" value="${item.quantity}" min="1" class="ucc-cart-item__quantity">
                                    </div>
                                    <div class="ucc-split__right">
                                        <span class="ucc-cart-item__price">${config.showPricesIncludingTax ? item.total.withTax : item.total.withoutTax}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                
            });
            
            // Toggle cart items and empty message
            this._host.querySelector<HTMLElement>('.ucc-cart-items')!.style.display = '';
            this._host.querySelector<HTMLElement>('.ucc-cart-empty')!.style.display = 'none';
            
            // Populate totals
            this._host.querySelector<HTMLElement>('.ucc-cart-total--subtotal .ucc-cart-total-value')!.textContent = cart.subtotal.withoutTax;
            this._host.querySelector<HTMLElement>('.ucc-cart-total--taxes .ucc-cart-total-value')!.textContent = cart.subtotal.tax;
            this._host.querySelector<HTMLElement>('.ucc-cart-total--total .ucc-cart-total-value')!.textContent = cart.subtotal.withTax;

            // Show totals
            this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.style.display = '';
            this._host.querySelector<HTMLElement>('.ucc-cart-message')!.style.display = '';
            
            // Enable checkout button
            this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.classList.remove('ucc-cart-checkout--disabled');
            
        } else {

            // Toggle cart items and empty message
            this._host.querySelector<HTMLElement>('.ucc-cart-items')!.style.display = 'none';
            this._host.querySelector<HTMLElement>('.ucc-cart-empty')!.style.display = '';
            
            // Hide totals 
            this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.style.display = 'none';
            this._host.querySelector<HTMLElement>('.ucc-cart-message')!.style.display = 'none';
            
            // Disable checkout button
            this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.classList.add('ucc-cart-checkout--disabled');
        }
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
            <div class="ucc-cart-empty" style="display: none;">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    <div class="ucc-cart-empty__message"></div>
                </div>
            </div>
        `)
        this.setFooter(`
            <div class="ucc-cart-totals">
                <div class="ucc-cart-totals__item ucc-cart-total ucc-cart-total--subtotal ucc-split">
                    <span class="ucc-cart-total-label ucc-split__left"></span>
                    <span class="ucc-cart-total-value ucc-split__right"></span>
                </div>
                <div class="ucc-cart-totals__item ucc-cart-total ucc-cart-total--taxes ucc-split">
                    <span class="ucc-cart-total-label ucc-split__left"></span>
                    <span class="ucc-cart-total-value ucc-split__right"></span>
                </div>
                <div class="ucc-cart-totals__item ucc-cart-total ucc-cart-total--total ucc-split">
                    <span class="ucc-cart-total-label ucc-split__left"></span>
                    <span class="ucc-cart-total-value ucc-split__right"></span>
                </div>
            </div>
            <div class="ucc-cart-message"></div>
            <a class="ucc-cart-checkout" href="#"></a>
        `)
        
        // Listen for cart item events
        const removeItem = async (item:CartItem) => {
            await this._cartRepository.removeItem(this.storeIdOrAlias, item.id).then(() => {
                this._host.dispatchEvent(new UccEvent(UccEvent.CART_CHANGED));
            });
        }
        this._addCartItemEventListener('click', '.ucc-cart-item__remove', removeItem);
        
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