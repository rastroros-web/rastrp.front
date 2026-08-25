import type { TrackingCarrier } from "@/lib/mock/types";

export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  /** Slugs con stock disponible para retiro (demo mock) */
  stockSlugs: string[];
};

/** Stock amplio en ambos puntos (demo): no bloquea el retiro. */
const ALL_PICKUP_STOCK = [
  "nike-air-force-1",
  "nike-dunk-low",
  "nike-jordan-1-low-azul",
  "nike-sb-black",
  "adidas-samba",
  "adidas-samba-ballet",
  "adidas-sambae",
  "adidas-samba-xlg",
  "adidas-campus",
  "adidas-gazelle",
  "adidas-spezial",
  "adidas-sl-72",
  "adidas-busenitz",
  "vans-old-skool",
  "vans-ultrarange",
  "vans-vr3",
  "vans-hylane",
  "new-balance-574",
  "new-balance-327",
  "converse-all-star",
  "zueco-kala",
  "zueco-india",
  "zueco-birk",
  "zueco-bour",
  "sandalia-birk",
];

export const STORES: StoreLocation[] = [
  {
    id: "centro",
    name: "Rastro Centro",
    address: "Riobamba 1432",
    city: "Rosario",
    hours: "Horario a coordinar",
    phone: "",
    stockSlugs: ALL_PICKUP_STOCK,
  },
  {
    id: "sur",
    name: "Rastro Sur",
    address: "Mitre 5437",
    city: "Rosario",
    hours: "Horario a coordinar",
    phone: "",
    stockSlugs: ALL_PICKUP_STOCK,
  },
];

export function getStore(id: string) {
  return STORES.find((s) => s.id === id);
}

export function storeHasCartStock(
  store: StoreLocation,
  productSlugs: string[]
): { ok: boolean; missing: string[] } {
  const missing = productSlugs.filter((s) => !store.stockSlugs.includes(s));
  return { ok: missing.length === 0, missing };
}

/** Tip carrier para retiro en tienda (no envío). */
export const PICKUP_CARRIER: TrackingCarrier = "rastro";
