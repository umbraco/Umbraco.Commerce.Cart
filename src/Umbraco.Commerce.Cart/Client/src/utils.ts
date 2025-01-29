export const isEmpty = (value: any) => 
{
    return (value == null || (typeof value === "string" && value.trim().length === 0));
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