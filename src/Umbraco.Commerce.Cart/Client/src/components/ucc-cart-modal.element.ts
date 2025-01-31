import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { CartConfig, CartItem } from "../types.ts";
import { UccModalElement } from "./ucc-modal.element.ts";
import { debounce, delegate, getUniqueSelector } from "../utils.ts";
import { UccCartRepository } from "../repositories/cart.respository.ts";
import { UccEvent } from "../events/ucc.event.ts";

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
                
                this.setTitle(config.locales![config.lang].cart_title);
                this.setCloseButtonLabel(config.locales![config.lang].close_cart);

                this._host.querySelector<HTMLElement>('.ucc-cart-total--subtotal .ucc-cart-total-label')!.textContent = config.locales![config.lang].subtotal;
                this._host.querySelector<HTMLElement>('.ucc-cart-total--taxes .ucc-cart-total-label')!.textContent = config.locales![config.lang].taxes;
                this._host.querySelector<HTMLElement>('.ucc-cart-message')!.textContent = config.locales![config.lang].shipping_and_discounts_message;
                this._host.querySelector<HTMLElement>('.ucc-cart-total--total .ucc-cart-total-label')!.textContent = config.locales![config.lang].total;
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.textContent = config.locales![config.lang].checkout;
                this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.setAttribute('href', config.checkoutUrl!);
                
                const cartEmptyMsg = this._host.querySelector<HTMLElement>('.ucc-cart-empty__message');
                if (cartEmptyMsg) {
                    cartEmptyMsg.textContent = config.locales![config.lang].cart_empty;
                }
                
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
            const activeEl = this._host.ownerDocument.activeElement as HTMLElement;
            const activeElSelector = activeEl ? getUniqueSelector(activeEl) : undefined;
            const activeElCaretPos = activeEl instanceof HTMLInputElement ? activeEl.selectionStart : undefined;
            this._host.querySelector('.ucc-cart-items')!.innerHTML = cart.items.map((item) => {
                const propsToDisplay = Object.keys(item.properties ?? {}).filter((x) => (config.properties ?? []).map(y => y.toLowerCase()).includes(x.toLowerCase()));
                return `
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
                                        ${propsToDisplay.length > 0 ? `
                                            <div class="ucc-cart-item__properties">
                                                ${propsToDisplay.map((key) => `
                                                    <div class="ucc-cart-item__property">
                                                        <span class="ucc-cart-item__property-key">${config?.locales![config.lang][`property_${key.toLowerCase()}`] ?? key}</span>
                                                        <span class="ucc-cart-item__property-value">${item.properties![key]}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        ${item.items && item.items.length ? `
                                            <div class="ucc-cart-item__bundle">
                                                <div class="ucc-cart-item__bundle-item ucc-cart-item__bundle-item--base">
                                                    <span class="ucc-cart-item__bundle-item-name">${config?.locales![config.lang].base_price ?? 'Base price'}</span>
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
                                        <button class="ucc-cart-item__remove" title="${config?.locales![config.lang].remove ?? 'Remove'}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
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
                    `
            }).join('');
            this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.style.display = '';
            this._host.querySelector<HTMLElement>('.ucc-cart-message')!.style.display = '';
            this._host.querySelector<HTMLElement>('.ucc-cart-total--subtotal .ucc-cart-total-value')!.textContent = cart.subtotal.withoutTax;
            this._host.querySelector<HTMLElement>('.ucc-cart-total--taxes .ucc-cart-total-value')!.textContent = cart.subtotal.tax;
            this._host.querySelector<HTMLElement>('.ucc-cart-total--total .ucc-cart-total-value')!.textContent = cart.subtotal.withTax;
            this._host.querySelector<HTMLElement>('.ucc-cart-checkout')!.classList.remove('ucc-cart-checkout--disabled');
            if (activeElSelector) {
                const activeEl = this._host.querySelector<HTMLElement>(activeElSelector);
                if (activeEl) {
                    activeEl.focus();
                    if (activeEl instanceof HTMLInputElement && activeElCaretPos) {
                        activeEl.setSelectionRange(activeElCaretPos!, activeElCaretPos!);
                    }
                }
            }
        } else {
            this._host.querySelector<HTMLElement>('.ucc-cart-items')!.innerHTML = `
                    <div class="ucc-cart-empty">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                            <div class="ucc-cart-empty__message">${config?.locales![config.lang].cart_empty ?? 'Your cart is empty'}</div>
                        </div>
                    </div>
                `;
            this._host.querySelector<HTMLElement>('.ucc-cart-totals')!.style.display = 'none';
            this._host.querySelector<HTMLElement>('.ucc-cart-message')!.style.display = 'none';
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