import { MasterProductData } from "../types.ts";

export class UcCartRepository {
    
    async addToCart(storeIdOrAlias:string, productData: MasterProductData) {
        return await fetch('/umbraco/commerce/cart/api/v1/session/cart', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Store': storeIdOrAlias
            },
            body: JSON.stringify(productData)
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                console.log("Oops! There was a problem submitting your form");
            }
        }).catch(error => {
            console.log(error)
        });
    }
    
}