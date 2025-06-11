import { AddToCartRequest, UpdateCartItemRequest } from "../types.ts";
import {UccEvent} from "../events/ucc.event.ts";

export class UccCartRepository {

    private _host: Element;
    
    constructor(host: Element) {
        this._host = host;
    }


    async getCart(storeIdOrAlias:string) {
        return await this._doRequest(storeIdOrAlias, '/umbraco/commerce/cart/api/v1/session/cart', 'GET');
    }
    
    async addToCart(storeIdOrAlias:string, productData: AddToCartRequest) {
        return await this._doRequest(storeIdOrAlias, '/umbraco/commerce/cart/api/v1/session/cart', 'POST', productData);
    }
    
    async removeItem(storeIdOrAlias:string, id:string) {
        return await this._doRequest(storeIdOrAlias, `/umbraco/commerce/cart/api/v1/session/cart/${id}`, 'DELETE');
    }
    
    async updateItem(storeIdOrAlias:string, id:string, productData: UpdateCartItemRequest) {
        return await this._doRequest(storeIdOrAlias, `/umbraco/commerce/cart/api/v1/session/cart/${id}`, 'PUT', productData);
    }
    
    private async _doRequest(storeIdOrAlias:string, url:string, method:string, body?:any) {
        return await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Store': storeIdOrAlias
            },
            body: body ? JSON.stringify(body) : undefined
        }).then(async response => {
            return { ok: response.ok, data: await response.text() };
        }).then(response => {
            if (response.ok) {
                return response.data ? JSON.parse(response.data) : undefined;
            } else {
                return Promise.reject(response.data);
            }
        }).catch(error => {
            this._host.dispatchEvent(new UccEvent(UccEvent.CART_ERROR, error));
            return Promise.reject(error);
        });
    }
    
}