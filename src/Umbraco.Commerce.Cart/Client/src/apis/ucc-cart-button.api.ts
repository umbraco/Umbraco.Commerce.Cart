import { UccEvent } from "../events/ucc.event.ts";

export class UccCartButtonApi {

    private readonly _host: HTMLElement;

    constructor(host: HTMLElement) {
        this._host = host;
        this._bindEvents();
    }
    
    private _bindEvents = () =>
    {
        this._host.addEventListener('click', async (e) => {
            e.preventDefault();
            this._host.dispatchEvent(new UccEvent(UccEvent.CART_OPEN));
        });
    }
    
}