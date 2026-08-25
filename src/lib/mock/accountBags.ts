import type { CartItem, CartShippingPref } from "@/lib/mock/types";
import { uid } from "@/lib/mock/money";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/mock/storage";

export const GUEST_BAG_ID = "__guest__";

export type AccountBag = {
  cart: CartItem[];
  wishlist: string[];
  shipping: CartShippingPref;
};

export type AccountBags = Record<string, AccountBag>;

export const EMPTY_SHIPPING: CartShippingPref = {
  zone: "rosario",
  postalCode: "",
  rate: null,
  deliveryDate: "",
  deliverySlot: "",
};

export function emptyBag(): AccountBag {
  return { cart: [], wishlist: [], shipping: { ...EMPTY_SHIPPING } };
}

export function bagOwnerId(sessionId: string | null | undefined): string {
  return sessionId || GUEST_BAG_ID;
}

export function normalizeShipping(
  shipping: CartShippingPref | null | undefined
): CartShippingPref {
  if (!shipping?.zone) return { ...EMPTY_SHIPPING };
  return {
    zone: shipping.zone,
    postalCode: shipping.postalCode || "",
    rate: shipping.rate || null,
    deliveryDate: shipping.deliveryDate || "",
    deliverySlot: shipping.deliverySlot || "",
  };
}

export function normalizeBag(
  bag:
    | {
        cart?: CartItem[];
        wishlist?: string[];
        shipping?: CartShippingPref | null;
      }
    | null
    | undefined
): AccountBag {
  return {
    cart: Array.isArray(bag?.cart) ? bag.cart : [],
    wishlist: Array.isArray(bag?.wishlist)
      ? bag.wishlist.filter((slug): slug is string => typeof slug === "string")
      : [],
    shipping: normalizeShipping(bag?.shipping),
  };
}

export function readBags(): AccountBags {
  return readJson<AccountBags>(STORAGE_KEYS.accountBags, {});
}

export function readBag(ownerId: string): AccountBag {
  return normalizeBag(readBags()[ownerId]);
}

export function writeBag(ownerId: string, bag: AccountBag) {
  const bags = readBags();
  bags[ownerId] = normalizeBag(bag);
  writeJson(STORAGE_KEYS.accountBags, bags);
}

export function clearAllBags() {
  writeJson(STORAGE_KEYS.accountBags, {});
}

export function mergeCarts(account: CartItem[], guest: CartItem[]): CartItem[] {
  const next = account.map((item) => ({ ...item }));
  for (const item of guest) {
    const idx = next.findIndex(
      (c) =>
        c.productSlug === item.productSlug &&
        c.variantId === item.variantId &&
        c.size === item.size
    );
    if (idx >= 0) {
      next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
    } else {
      next.push({ ...item, id: uid("cart") });
    }
  }
  return next;
}

export function mergeWishlists(account: string[], guest: string[]): string[] {
  return [...new Set([...account, ...guest])];
}

function shippingFilled(shipping: CartShippingPref): boolean {
  return Boolean(
    shipping.rate ||
      shipping.deliveryDate ||
      shipping.deliverySlot ||
      shipping.postalCode
  );
}

export function mergeShipping(
  account: CartShippingPref,
  guest: CartShippingPref
): CartShippingPref {
  if (shippingFilled(account)) return account;
  if (shippingFilled(guest)) return guest;
  return { ...EMPTY_SHIPPING };
}

export function mergeBags(account: AccountBag, guest: AccountBag): AccountBag {
  return {
    cart: mergeCarts(account.cart, guest.cart),
    wishlist: mergeWishlists(account.wishlist, guest.wishlist),
    shipping: mergeShipping(account.shipping, guest.shipping),
  };
}

/** Primera vez: el carrito/favoritos globales pasan a la cuenta (o invitado) actual. */
export function migrateLegacyBag(ownerId: string): AccountBag {
  const existing = readJson<AccountBags | null>(STORAGE_KEYS.accountBags, null);
  if (existing) return readBag(ownerId);

  writeBag(ownerId, {
    cart: readJson<CartItem[]>(STORAGE_KEYS.cart, []),
    wishlist: readJson<string[]>(STORAGE_KEYS.wishlist, []),
    shipping: normalizeShipping(
      readJson<CartShippingPref | null>(STORAGE_KEYS.shipping, null)
    ),
  });
  return readBag(ownerId);
}
