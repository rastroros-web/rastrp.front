import type { ShopProduct } from "@/lib/mock/types";
import { sizeQty } from "@/lib/mock/stock";

export type LowStockItem = {
  slug: string;
  name: string;
  brand: string;
  variantId: string;
  variantName: string;
  size: string;
  qty: number;
  tone: "out" | "low";
};

/** Rojo = 0 · Naranja = 1–10 · Verde = >10 */
export const LOW_STOCK_THRESHOLD = 10;

export type StockLevelTone = "out" | "low" | "ok";

export function stockLevelTone(qty: number): StockLevelTone {
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

/** Clases para chips / badges de stock */
export function stockLevelClasses(qty: number): {
  box: string;
  text: string;
  label: string;
} {
  const tone = stockLevelTone(qty);
  if (tone === "out") {
    return {
      box: "border-red-200 bg-red-50",
      text: "text-red-600",
      label: "Sin stock",
    };
  }
  if (tone === "low") {
    return {
      box: "border-orange-200 bg-orange-50",
      text: "text-orange-700",
      label: `${qty} u.`,
    };
  }
  return {
    box: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-700",
    label: `${qty} u.`,
  };
}

export function getLowStockItems(products: ShopProduct[]): LowStockItem[] {
  const items: LowStockItem[] = [];
  for (const p of products) {
    if (p.active === false) continue;
    for (const v of p.variants) {
      for (const s of v.sizes) {
        const qty = sizeQty(s);
        if (qty <= LOW_STOCK_THRESHOLD) {
          items.push({
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            variantId: v.id,
            variantName: v.name,
            size: s.label,
            qty,
            tone: qty === 0 ? "out" : "low",
          });
        }
      }
    }
  }
  return items.sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name));
}
