import type { ProductSize } from "@/data/catalog";
import type { ShopProduct } from "@/lib/mock/types";

export function sizeQty(s: {
  stock?: number;
  inStock?: boolean;
}): number {
  if (typeof s.stock === "number" && Number.isFinite(s.stock)) {
    return Math.max(0, Math.floor(s.stock));
  }
  return s.inStock ? 5 : 0;
}

export function syncSizeStock(s: ProductSize): ProductSize {
  const stock = sizeQty(s);
  return { ...s, stock, inStock: stock > 0 };
}

export function normalizeProductStock(product: ShopProduct): ShopProduct {
  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      sizes: v.sizes.map(syncSizeStock),
    })),
  };
}

export function getSizeStock(
  product: ShopProduct | undefined,
  variantId: string,
  sizeLabel: string
): number {
  if (!product) return 0;
  const variant = product.variants.find((v) => v.id === variantId);
  const size = variant?.sizes.find((s) => s.label === sizeLabel);
  return size ? sizeQty(size) : 0;
}

export function stockLabelFromSizes(
  sizes: { inStock?: boolean; stock?: number }[]
): { tone: "ok" | "low" | "out"; text: string } | null {
  const qtys = sizes.map(sizeQty);
  const available = qtys.filter((q) => q > 0);
  const totalUnits = qtys.reduce((a, b) => a + b, 0);
  if (available.length === 0 || totalUnits === 0) {
    return { tone: "out", text: "Sin stock" };
  }
  const minQty = Math.min(...available);
  if (minQty <= 2 || totalUnits <= 6) {
    return { tone: "low", text: `Quedan ${totalUnits} u.` };
  }
  if (available.length <= 3) {
    return { tone: "low", text: `Últimos ${available.length} talles` };
  }
  return null;
}

export function countInStockSizes(sizes: { stock?: number; inStock?: boolean }[]) {
  return sizes.filter((s) => sizeQty(s) > 0).length;
}
