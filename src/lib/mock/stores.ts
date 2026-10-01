import type { TrackingCarrier } from "@/lib/mock/types";

export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
};

/** Ambos locales tienen todo el stock de la tienda online. */
export const STORES: StoreLocation[] = [
  {
    id: "centro",
    name: "Rastro Centro",
    address: "Riobamba 1432",
    city: "Rosario",
    hours: "Horario a coordinar",
    phone: "",
  },
  {
    id: "sur",
    name: "Rastro Sur",
    address: "Mitre 5437",
    city: "Rosario",
    hours: "Horario a coordinar",
    phone: "",
  },
];

export function getStore(id: string) {
  return STORES.find((s) => s.id === id);
}

/** Tip carrier para retiro en tienda (no envío). */
export const PICKUP_CARRIER: TrackingCarrier = "rastro";
