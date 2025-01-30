import { AddToCartRequest, UpdateCartItemRequest } from "../types.ts";

export class UccCartRepository {

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
        }).then(response => {
            if (response.ok) {
                return response.text();
            } else {
                console.log("Oops! There was a problem submitting your form");
            }
        }).then(data => {
            if (data) {
                return JSON.parse(data);
            }
        }).catch(error => {
            console.log(error)
        });
    }
    
}