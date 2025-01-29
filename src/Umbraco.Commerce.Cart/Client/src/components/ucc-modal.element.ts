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
    
    public open = () => {
        this._host.querySelector('.ucc-modal-container')!.classList.add('ucc-modal-container--open');
    }

    public close = () => {
        this._host.querySelector('.ucc-modal-container')!.classList.remove('ucc-modal-container--open');
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
                    <h3 id="ucc-modal-title" class="ucc-modal-title">TITLE</h3>
                    <button class="ucc-modal-close" title="CLOSE">X</button>
                </div>
                <div class="ucc-modal-body"></div>
                <div class="ucc-modal-footer"></div>
            </div>
        `;
        el.querySelector('.ucc-modal-background')!.addEventListener('click', this.close);
        el.querySelector('.ucc-modal-close')!.addEventListener('click', this.close);
        this._host.appendChild(el);
    }

    render() 
    { }
}