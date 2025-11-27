import { processAddToCartButtons } from "../processors/ucc-add-to-cart-button.processor.ts";
import { Cart, CartConfig } from "../types.ts";
import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { UccCartModalElement } from "../components/ucc-cart-modal.element.ts";
import { UccEvent } from "../events/ucc.event.ts";
import { UccCartRepository } from "../repositories/cart.respository.ts";
import { processCartButtons } from "../processors/ucc-cart-button.processor.ts";
import { processCartCountLabels } from "../processors/ucc-cart-count-labels.processor.ts";

export class UccApi {
    
    public readonly defaultLocales : Record<string, Record<string, string>> = {
        en: {
            cart_title: 'My Cart',
            close_cart: 'Close Cart (ESC)',
            checkout: 'Checkout',
            taxes: 'Taxes',
            subtotal: 'Subtotal',
            total: 'Total',
            shipping_and_discounts_message: 'Calculate shipping and apply discounts during checkout',
            remove: 'Remove',
            cart_empty: 'Your cart is empty',
        },
    }
    
    private readonly _host;
    private _context = UCC_CART_CONTEXT;
    private _cartRepository: UccCartRepository;
    private _cartModal: UccCartModalElement;
    
    constructor(host: HTMLElement) {
        this._host = host;
        this._cartRepository = new UccCartRepository(host);
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
        this._host.addEventListener(UccEvent.CART_ERROR, async (e: Event) => {
            const evt = e as UccEvent;
            const config = this._context.config.get();
            config?.onError?.apply(this, [evt.Detail]);
            console.log(evt.Detail);
        });
    }
    
    private _observerDocumentLang = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                    if (Object.keys(this._context.config.get()!.locales!).includes(this._host.ownerDocument.documentElement.lang)) {
                        this._context.config.set({
                            ...this._context.config.get()!,
                            lang: this._host.ownerDocument.documentElement.lang
                        });
                    } else {
                        this.setLang('en');
                    }
                }
            });
        });
        observer.observe(this._host.ownerDocument.documentElement, { attributes: true });
    }
    
    public init = async (config:Partial<CartConfig>) => {

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

        // Set the config in context
        this._context.config.set(cfg);
        
        // Fetch the cart
        await this._fetchCart();

        // Bind UI elements
        this.bind();
    }
    
    public bind = () => {
        processAddToCartButtons(this._host);
        processCartButtons(this._host);
        processCartCountLabels(this._host);
    }
    
    public setLang = (lang:string) => {
        this._host.ownerDocument.documentElement.lang = lang;
    }
    
    public setStore = (store:string) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ ...currentConfig, store });
    }
    
    public setCheckoutUrl = (url:string) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ ...currentConfig, checkoutUrl: url });
    }

    public addLocale = (locale:string, values:Record<string, string>) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ 
            ...currentConfig,
            locales: { ...currentConfig.locales, [locale]: values }
        });
    }
    
    public showProperty = (property:string) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ 
            ...currentConfig,
            properties: [ ...(currentConfig.properties ?? []), property ]
        });
    }
    
    public showPricesIncludingTax = (value:boolean) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ 
            ...currentConfig,
            showPricesIncludingTax: value
        });
    }
    
    public setOnError = (callback:(msg:string) => void) => {
        const currentConfig = this._context.config.get()!;
        this._context.config.set({ 
            ...currentConfig,
            onError: callback
        });
    }
    
    public openCart = () => {
        this._cartModal.open();
    }
    
    public closeCart = () => {
        this._cartModal.close();
    }
    
}