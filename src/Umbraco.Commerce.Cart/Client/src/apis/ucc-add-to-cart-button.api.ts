import { isEmpty } from "../utils.ts";
import { MasterProductData } from "../types.ts";
import { UccCartRepository } from "../repositories/cart.respository.ts";
import { UCC_CART_CONTEXT } from "../contexts/ucc.context.ts";
import { UccEvent } from "../events/ucc.event.ts";

export class UccAddToCartButtonApi {

    private static _attrMap = [
        { attr: 'product-reference', prop: 'productReference', isRequired: true },
        { attr: 'product-variant-reference', prop: 'productVariantReference'},
        { attr: 'quantity', prop: 'quantity', formatter: (value: string) => parseFloat(value), defaultValue: 1 },
        { attr: 'bundle-reference', prop: 'bundleReference' },
        { attr: 'bundle-item', prop: 'bundleItems', nestedMap: [
            { attr: 'product-reference', prop: 'productReference', isRequired: true },
            { attr: 'product-variant-reference', prop: 'productVariantReference' }, 
            { attr: 'quantity', prop: 'quantity', formatter: (value: string) => parseFloat(value), defaultValue: 1 },
            { attr: 'property', prop: 'properties', formatter: (values: any[]) => values.reduce((acc, { key, value }) => ({ ...acc, [key]: value ?? null }), {}), nestedMap: [
                { attr: 'key', prop: 'key', isRequired: true },
                { attr: 'value', prop: 'value' },
            ] },
        ] },
        { attr: 'property', prop: 'properties', formatter: (values: any[]) => values.reduce((acc, { key, value }) => ({ ...acc, [key]: value ?? null }), {}), nestedMap: [
            { attr: 'key', prop: 'key', isRequired: true },
            { attr: 'value', prop: 'value' },
        ] },
    ]
    
    private readonly _host: HTMLElement;
    private _productData:MasterProductData | null  = null;
    private _cartRepository = new UccCartRepository();
    private _context = UCC_CART_CONTEXT;
    
    constructor(host: HTMLElement) {
        this._host = host;
        this._observeAttributes();
        this._bindEvents();
    }
    
    private _bindEvents = () =>
    {
        this._host.addEventListener('click', async (e) => {
            e.preventDefault();
            if (this._productData) {
                await this._cartRepository.addToCart(this._context.config.get()!.store!, this._productData).then(() => {
                    this._host.dispatchEvent(new UccEvent(UccEvent.CART_CHANGED));
                    this._host.dispatchEvent(new UccEvent(UccEvent.CART_OPEN));
                })
            }
        });
    }
    
    private _observeAttributes = () => 
    {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName?.startsWith('data-ucc-')) {
                    this._productData = this._processDataAttributes(UccAddToCartButtonApi._attrMap, 'data-ucc-');
                }
            });
        });
        
        observer.observe(this._host, { attributes: true });
    }
    
    private _processDataAttributes = (attrMap:any, outerAttrKey: string | undefined = undefined) =>
    {
        let result : any = { };
        let allValid = true;

        attrMap.forEach((entry:any) => {

            const { prop, attr, defaultValue, nestedMap, isRequired, formatter } = entry;
            const fullAttrKey = outerAttrKey ? `${outerAttrKey}${attr}` : attr;
            const value = this._host.getAttribute(fullAttrKey);

            if (nestedMap) 
            {
                const nestedResults = [];
                let nestedIdx = 1;

                while (nestedResults.length < 1000)
                {
                    const nestedAttrKeyPrefix = `${fullAttrKey}${nestedIdx}-`;
                    const nestedItem = this._processDataAttributes(nestedMap, nestedAttrKeyPrefix);
                    if (!nestedItem) break;
                    nestedResults.push(nestedItem);
                    nestedIdx++;
                }

                if (nestedResults.length)
                {
                    result[prop] = formatter ? formatter(nestedResults) : nestedResults;
                }
            }
            else
            {
                allValid = allValid && (!isRequired || !isEmpty(value));

                if (!isEmpty(value))
                {
                    result[prop] = formatter ? formatter(value) : value
                }
                else if (!isEmpty(defaultValue))
                {
                    result[prop] = defaultValue
                }
            }

        });

        return allValid && Object.keys(result).length > 0 ? result : null;
        
    }
    
}