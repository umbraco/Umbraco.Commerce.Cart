export const isEmpty = (value: any) => 
{
    return (value == null || (typeof value === "string" && value.trim().length === 0));
}

export const delegate = (el:Element, selector:string, event:string, handler: Function) => {
    el.addEventListener(event, e => {
        const target = e.target as Element;
        if (target.matches(selector) || target.closest(selector)) handler(e, el);
    });
}

export const debounce = (callback: Function, wait: number) => {
    let timeoutId : number | undefined = undefined;
    return (...args : any[]) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
}

export type ReactiveValue<T> = {
    hasValue: () => boolean;
    get: () => T | null;
    set: (newValue: T | null) => void;
    subscribe: (subscriber: Function) => () => void;
}

export const reactiveValue = <T>(initialValue:T | null) : ReactiveValue<T> =>
{
    let value : T | null = initialValue;
    const subscribers = new Set<Function>()

    function hasValue() : boolean {
        return value !== null;
    }
    
    function get() : T | null {
        return value;
    }

    function set(newValue:T | null) : void {
        if (value !== newValue) {
            const oldValue = value;
            value = newValue;
            subscribers.forEach((subscriber) => subscriber(newValue, oldValue));
        }
    }

    function subscribe(subscriber: Function) : () => void {
        subscribers.add(subscriber);
        subscriber(value, null);
        return () => {
            subscribers.delete(subscriber);
        }
    }

    return { hasValue, get, set, subscribe };
}