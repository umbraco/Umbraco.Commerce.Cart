import { processAddToCartButtons } from "../processors/ucc-add-to-cart-button.processor.ts";
import { Cart, CartConfig } from "../types.ts";
import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { UccCartModalElement } from "../components/ucc-cart-modal.element.ts";
import { UccEvent } from "../events/ucc.event.ts";
import { UccCartRepository } from "../repositories/cart.respository.ts";
import {processCartButtons} from "../processors/ucc-cart-button.processor.ts";
import {processCartCountLabels} from "../processors/ucc-cart-count-labels.processor.ts";

export class UccApi {
    
    public readonly defaultLocales : Record<string, Record<string, string>> = {
        en: {
            cart_title: 'Cart Summary',
            close_cart: 'Close Cart',
            checkout: 'Checkout',
            taxes: 'Taxes',
            shipping: 'Shipping',
            shipping_message: 'Calculated at Checkout',
            total: 'Total',
            remove: 'Remove',
            cart_empty: 'Your cart is empty',
        },
    }
    
    private readonly _host;
    private _context = UCC_CART_CONTEXT;
    private _cartRepository = new UccCartRepository();
    private _cartModal: UccCartModalElement;
    
    constructor(host: HTMLElement) {
        this._host = host;
        this._cartModal = new UccCartModalElement(host);
        this._observerDocumentLang();
        this._bindEvents();
    }
    
    private _fetchCart = async () => {
        return await this._cartRepository.getCart(this._context.config.get()!.store!).then(data => {
            this._context.cart.set(data as Cart);
        })
    }
    
    private _bindEvents = () => {
        this._host.addEventListener(UccEvent.CART_OPEN, async () => {
            this.openCart();
        });
        this._host.addEventListener(UccEvent.CART_CLOSE, async () => {
            this.closeCart();
        });
        this._host.addEventListener(UccEvent.CART_CHANGED, async () => {
            await this._fetchCart();
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
    
    public init = (config?:Partial<CartConfig>) => {
        
        if (config) 
        {
            const { locales, ...rest } = config;
            
            // Merge config with default values
            const cfg : CartConfig = {
                lang: 'en',
                ...rest
            }

            cfg.locales = {
                ...this.defaultLocales,
                ...locales
            }
            
            console.log(cfg)

            // Set the config in context
            this._context.config.set(cfg);
            
            // Fetch the cart
            this._fetchCart();
        }

        // Process UI elements
        processAddToCartButtons(this._host);
        processCartButtons(this._host);
        processCartCountLabels(this._host);
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
    
    public showProperty = (property:string) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ 
            properties: [...currentConfig.properties!, property],
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