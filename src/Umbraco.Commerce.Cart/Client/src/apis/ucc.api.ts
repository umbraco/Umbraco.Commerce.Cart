import { processAddToCartButtons } from "../processors/ucc-add-to-cart-button.processor.ts";
import { CartConfig } from "../types.ts";
import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { UccCartModalElement } from "../components/ucc-cart-modal.element.ts";
import { UccCartUpdateEvent } from "../events/ucc-cart-update.event.ts";

export class UccApi {
    
    private readonly _host;
    private _context = UCC_CART_CONTEXT;
    private _initialized = false;
    private _cartModal: UccCartModalElement;
    
    constructor(host: HTMLElement) {
        this._host = host;
        this._cartModal = new UccCartModalElement(host);
        this._observerDocumentLang();
        this._bindEvents();
    }
    
    private _bindEvents = () => {
        this._host.addEventListener('uc-cart-item-added', async () => {
            // TODO: Check for an autoOpen config option
            this.openCart();
        });
        this._host.addEventListener(UccCartUpdateEvent.TYPE, async (e) => {
            const evt = e as UccCartUpdateEvent;
            this._context.cart.set(evt.cart);
        });
    }
    
    private _observerDocumentLang = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                    this._context.config.set({ lang: this._host.ownerDocument.documentElement.lang, ...this._context.config.get() });
                }
            });
        });
        observer.observe(this._host.ownerDocument.documentElement, { attributes: true });
    }
    
    public init = (config:Partial<CartConfig>) => {
        
        // Merge config with default values
        const cfg = {
            lang: 'en',
            ...config
        }
        
        // Ensure there is a default locale
        if (!cfg.locales?.en) 
        {
            cfg.locales = { 
                en: {
                    cart_title: 'Cart Summary',
                    close_cart: 'Close Cart',
                    checkout: 'Checkout',
                    taxes: 'Taxes',
                    shipping: 'Shipping',
                    shipping_message: 'Calculated at Checkout',
                    total: 'Total',
                },
                ...cfg.locales
            }
        }
        
        // Set the config in context
        this._context.config.set(cfg);
        
        // One time initialization
        if (!this._initialized) {
            // TODO: Ensure cart model is created
            this._initialized = true;
        }

        // Process UI elements
        processAddToCartButtons(this._host);
    }
    
    public setLang = (lang:string) => {
        this._host.ownerDocument.documentElement.lang = lang;
    }
    
    public setStore = (store:string) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ store, ...currentConfig });
    }
    
    public setCheckoutUrl = (url:string) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ checkoutUrl: url, ...currentConfig });
    }

    public addLocale = (locale:string, values:Record<string, string>) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ 
            locales: { ...currentConfig.locales, [locale]: values },
            ...currentConfig
        });
    }
    
    public openCart = () => {
        this._cartModal.open();
    }
    
    public closeCart = () => {
        this._cartModal.close();
    }
    
}