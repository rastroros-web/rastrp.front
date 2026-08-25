const PREFIX = "rastro_mock_v6_";

export const STORAGE_KEYS = {
  users: `${PREFIX}users`,
  session: `${PREFIX}session`,
  cart: `${PREFIX}cart`,
  orders: `${PREFIX}orders`,
  products: `${PREFIX}products`,
  wishlist: `${PREFIX}wishlist`,
  recentlyViewed: `${PREFIX}recently_viewed`,
  promos: `${PREFIX}promos`,
  shipping: `${PREFIX}shipping`,
  accountBags: `${PREFIX}account_bags`,
} as const;

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
