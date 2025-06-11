import { UCC_CART_CONTEXT } from "./contexts/ucc.context.ts";

export const localize = (key:string) => {
    const cfg = UCC_CART_CONTEXT.config.get();
    const lang = cfg?.lang ?? 'en';
    return cfg?.locales![lang]?.[key] ?? cfg?.locales!['en']?.[key] ?? key;
}