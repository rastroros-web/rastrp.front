import type { CostoRow, EcommerceRow, VentaRow } from "@/lib/mock/business";
import {
  catalogTargetFromSheet,
  costoForSheetRow,
  matchSheetRow,
  normKey,
} from "@/lib/mock/sheetMatch";

export type ResolvedVentaLink = {
  slug: string | null;
  variantId: string | null;
  label: string;
  costoUnit: number | null;
  matched: boolean;
};

/** Alias de texto libre de la planilla → producto/color de la tienda. */
const NAME_TO_VARIANT: { test: RegExp; slug: string; variantId: string }[] = [
  { test: /samba\s*(chocolate|choco)/i, slug: "adidas-samba", variantId: "chocolate" },
  { test: /samba\s*(classic|clasica|clásica|punta\s*blanca)/i, slug: "adidas-samba", variantId: "classic" },
  { test: /samba\s*(black|blcak|negras?|negra)/i, slug: "adidas-samba", variantId: "black" },
  { test: /samba\s*off\s*white/i, slug: "adidas-samba", variantId: "black-off" },
  { test: /samba\s*(beige\s*tex|tex\b|beige)/i, slug: "adidas-samba", variantId: "beige-tex" },
  { test: /samba\s*cherry/i, slug: "adidas-samba", variantId: "cherry" },
  { test: /samba\s*caramelo/i, slug: "adidas-samba", variantId: "caramelo" },
  { test: /sambae/i, slug: "adidas-sambae", variantId: "black" },
  { test: /sl\s*72/i, slug: "adidas-sl-72", variantId: "chocolate" },
  { test: /spezial\s*off/i, slug: "adidas-spezial", variantId: "off-white" },
  { test: /spezial\s*verde/i, slug: "adidas-spezial", variantId: "verde" },
  { test: /campus\s*(choco|marron)/i, slug: "adidas-campus", variantId: "chocolate" },
  { test: /campus/i, slug: "adidas-campus", variantId: "gris" },
  { test: /gazelle\s*cherry/i, slug: "adidas-gazelle", variantId: "cherry" },
  { test: /gazelle\s*(azul|blackblue|dark|blue)/i, slug: "adidas-gazelle", variantId: "dark-blue" },
  { test: /gazelle\s*verde/i, slug: "adidas-gazelle", variantId: "verde" },
  { test: /gazelle/i, slug: "adidas-gazelle", variantId: "cherry" },
  { test: /busenitz|buzenits/i, slug: "adidas-busenitz", variantId: "total-black" },
  { test: /air\s*force.*black|af1.*black/i, slug: "nike-air-force-1", variantId: "total-black" },
  { test: /air\s*force|af1/i, slug: "nike-air-force-1", variantId: "white" },
  { test: /dunk/i, slug: "nike-dunk-low", variantId: "panda" },
  { test: /nike\s*sb|\bsb\b/i, slug: "nike-sb-black", variantId: "nico" },
  { test: /jordan/i, slug: "nike-jordan-1-low-azul", variantId: "nico" },
  { test: /vr3/i, slug: "vans-vr3", variantId: "black" },
  { test: /ultrarange/i, slug: "vans-ultrarange", variantId: "black" },
  { test: /hylane/i, slug: "vans-hylane", variantId: "black" },
  { test: /old\s*skool|vans\s*cl[aá]sicas/i, slug: "vans-old-skool", variantId: "blanck" },
  { test: /new\s*balance\s*327|nb\s*327/i, slug: "new-balance-327", variantId: "beige" },
  { test: /new\s*balance\s*574|nb\s*574/i, slug: "new-balance-574", variantId: "beige" },
  { test: /kala\s*vison/i, slug: "zueco-kala", variantId: "vison" },
  { test: /bour.*vison/i, slug: "zueco-bour", variantId: "beige" },
  { test: /pantufl/i, slug: "eva", variantId: "camel" },
  { test: /ojota.*adidas/i, slug: "ojota-adidas-off-white", variantId: "nico" },
];

function variantFromName(articulo: string): { slug: string; variantId: string } | null {
  const n = String(articulo || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  for (const { test, slug, variantId } of NAME_TO_VARIANT) {
    if (test.test(n)) return { slug, variantId };
  }
  return null;
}

function splitCombo(articulo: string): string[] {
  return String(articulo || "")
    .split(/\s+y\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function resolveVentaArticulo(
  articulo: string,
  costos: CostoRow[] = [],
  ecommerce: EcommerceRow[] = []
): ResolvedVentaLink {
  const raw = articulo.trim();
  const ecom = matchSheetRow(ecommerce, { modelo: raw, color: raw }) ||
    ecommerce.find(
      (row) =>
        normKey(`${row.marca} ${row.modelo} ${row.color}`).includes(normKey(raw)) ||
        normKey(raw).includes(normKey(`${row.modelo} ${row.color}`))
    );
  const target = ecom
    ? catalogTargetFromSheet(ecom)
    : variantFromName(raw);
  const costoUnit = ecom
    ? costoForSheetRow(ecom, costos)
    : costoForSheetRow({ modelo: raw }, costos);
  const label = ecom
    ? `${ecom.marca} ${ecom.modelo} ${ecom.color}`.replace(/\s+/g, " ").trim()
    : raw;

  return {
    slug: target?.slug ?? null,
    variantId: target?.variantId ?? null,
    label,
    costoUnit,
    matched: Boolean(target?.slug),
  };
}

export function enrichVentaCosts(
  ventas: VentaRow[],
  costos: CostoRow[],
  ecommerce: EcommerceRow[]
): { ventas: VentaRow[]; filled: number } {
  let filled = 0;
  const next = ventas.map((v) => {
    if (v.costo && v.costo > 0) return v;
    const link = resolveVentaArticulo(v.articulo, costos, ecommerce);
    if (link.costoUnit == null) return v;
    const costo = link.costoUnit * (v.cantidad || 1);
    filled += 1;
    return {
      ...v,
      costo,
      ganancia: v.total - costo,
    };
  });
  return { ventas: next, filled };
}

export type StockDeduction = {
  slug: string;
  variantId: string;
  qty: number;
  talle?: string | null;
};

/** Agrupa ventas resueltas para descontar stock del catálogo */
export function ventasToStockDeductions(ventas: VentaRow[]): StockDeduction[] {
  const map = new Map<string, StockDeduction>();
  for (const v of ventas) {
    const talle = v.talle?.trim() || null;
    const parts = splitCombo(v.articulo);
    const links =
      parts.length > 1
        ? parts.map((part) => resolveVentaArticulo(part))
        : [resolveVentaArticulo(v.articulo)];
    const qtyEach = parts.length > 1 ? 1 : v.cantidad || 1;
    for (const link of links) {
      if (!link.slug || !link.variantId) continue;
      const key = `${link.slug}::${link.variantId}::${talle ?? "*"}`;
      const cur = map.get(key) ?? {
        slug: link.slug,
        variantId: link.variantId,
        qty: 0,
        talle,
      };
      cur.qty += qtyEach;
      map.set(key, cur);
    }
  }
  return [...map.values()];
}
