export class UccBaseProcessor<T>
{
    private _apiMap  = new WeakMap<HTMLElement, T>();
    
    process(host: HTMLElement, selector: string, factory: (el: HTMLElement) => T)
    {
        const els = host.querySelectorAll(selector);
        for (let i = 0; i < els.length; i++) {
            const el = els[i] as HTMLElement;
            if (!this._apiMap.has(el)) {
                this._apiMap.set(el, factory(el));
            }
        }
    }
}