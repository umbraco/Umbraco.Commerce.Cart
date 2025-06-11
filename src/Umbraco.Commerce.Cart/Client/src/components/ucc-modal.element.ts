import {trapFocus} from "../utils.ts";

export class UccModalElement
{
    protected readonly _host: HTMLElement;

    constructor(host: HTMLElement) {
        this._host = host
        this._attachModalTemplate();
    }
    
    protected setTitle = (title: string) => {
        this._host.querySelector('.ucc-modal-title')!.textContent = title;
    }
    
    protected setCloseButtonLabel = (label: string) => {
        this._host.querySelector('.ucc-modal-close')!.setAttribute('title', label);
    }
    
    protected setBody = (el: HTMLElement | string) => {
        if (typeof el === 'string') {
            this._host.querySelector('.ucc-modal-body')!.innerHTML = el;
        } else {
            this._host.querySelector('.ucc-modal-body')!.replaceChildren(el);
        }
    }
    
    protected setFooter = (el: HTMLElement | string) => {
        if (typeof el === 'string') {
            this._host.querySelector('.ucc-modal-footer')!.innerHTML = el;
        } else {
            this._host.querySelector('.ucc-modal-footer')!.replaceChildren(el);
        }
    }
    
    private _escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.close();
        }
    }
    
    private _trapFocus = (e: KeyboardEvent) => {
        trapFocus(e, '.ucc-modal');
    }
    
    public open = () => {
        this._host.querySelector('.ucc-modal-container')!.classList.add('ucc-modal-container--open');
        this._host.ownerDocument.body.style.overflow = 'hidden';
        this._host.ownerDocument.addEventListener('keydown', this._escHandler);
        this._host.ownerDocument.addEventListener('keydown', this._trapFocus);
    }

    public close = () => {
        this._host.querySelector('.ucc-modal-container')!.classList.remove('ucc-modal-container--open');
        this._host.ownerDocument.body.style.overflow = '';
        this._host.ownerDocument.removeEventListener('keydown', this._escHandler);
        this._host.ownerDocument.removeEventListener('keydown', this._trapFocus);
    }

    private _attachModalTemplate() 
    {
        const el = document.createElement('div');
        el.className = 'ucc-modal-container';
        el.setAttribute('aria-labelledby', 'ucc-modal-title');
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML = `
            <div class="ucc-modal-background" aria-hidden="true"></div>
            <div class="ucc-modal">
                <div class="ucc-modal-header">
                    <h2 id="ucc-modal-title" class="ucc-modal-title">TITLE</h2>
                    <button class="ucc-modal-close" title="CLOSE">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div class="ucc-modal-body"></div>
                <div class="ucc-modal-footer"></div>
            </div>
        `;
        el.querySelector('.ucc-modal-background')!.addEventListener('click', this.close);
        el.querySelector('.ucc-modal-close')!.addEventListener('click', this.close);
        this._host.appendChild(el);
    }
}