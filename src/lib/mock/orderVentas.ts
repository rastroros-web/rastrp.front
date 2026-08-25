import type { BusinessData, EcommerceRow, PlanillaRow, VentaRow } from "@/lib/mock/business";
import { resolveVentaArticulo } from "@/lib/mock/resolveVenta";
import { catalogTargetFromSheet } from "@/lib/mock/sheetMatch";
import { sanitizeStockQty } from "@/lib/mock/syncEcommerce";
import { itemLabel, ledgerFecha, localIsoDate, planillaDescripcion } from "@/lib/mock/orderLabels";
import { parseMoney, uid } from "@/lib/mock/money";
import { readJson, writeJson } from "@/lib/mock/storage";
import type { MockOrder, ShopProduct } from "@/lib/mock/types";
import { sizeQty } from "@/lib/mock/stock";
import { medioToPlanillaBuckets } from "@/lib/mock/sheetCols";

export const BUSINESS_KEY = "rastro_mock_v6_business";
export const BUSINESS_VENTAS_EVENT = "rastro:business-ventas";
/** Recarga completa del business (ej. stock e-commerce descontado) */
export const BUSINESS_CHANGED_EVENT = "rastro:business-changed";

/** Misma regla que el backend: la venta entra a la planilla cuando ya se cobró. */
const LEDGER_STATUSES = new Set([
  "pagado",
  "preparando",
  "enviado",
  "entregado",
]);

export function orderCountsInLedger(status: string | null | undefined): boolean {
  return LEDGER_STATUSES.has(String(status || ""));
}

function findEcommerceRow(
  ecommerce: BusinessData["ecommerce"],
  productSlug: string,
  variantId: string
) {
  return ecommerce.find((row) => {
    const target = catalogTargetFromSheet(row);
    return Boolean(target && target.slug === productSlug && target.variantId === variantId);
  });
}

function notifyBusinessChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BUSINESS_CHANGED_EVENT));
}

/** Lee planilla business (localStorage o null) */
export function readBusinessData(): BusinessData | null {
  return readJson<BusinessData | null>(BUSINESS_KEY, null);
}

/**
 * Escribe stock del producto shop → fila E-commerce (fuente de verdad).
 * Usado al editar stock en admin/stock.
 */
export function pushProductStockToEcommerce(product: ShopProduct): number {
  const biz = readBusinessData();
  if (!biz) return 0;

  let updated = 0;
  const ecommerce = biz.ecommerce.map((row) => {
    const target = resolveTargetFromRow(row);
    if (!target || target.slug !== product.slug) return row;
    const variant = product.variants.find((v) => v.id === target.variantId);
    if (!variant) return row;
    const stock: Record<string, number> = {};
    for (const s of variant.sizes) {
      const q = sanitizeStockQty(sizeQty(s));
      if (q > 0) stock[s.label] = q;
    }
    updated += 1;
    return { ...row, stock } satisfies EcommerceRow;
  });

  if (!updated) return 0;
  writeJson(BUSINESS_KEY, { ...biz, ecommerce });
  notifyBusinessChanged();
  return updated;
}

function resolveTargetFromRow(
  row: EcommerceRow
): { slug: string; variantId: string } | null {
  return catalogTargetFromSheet(row);
}

function medioFromOrder(order: MockOrder): string {
  if (order.paymentMethod === "transferencia") return "Transferencia";
  return "Mercado Pago";
}

export function orderToVentas(
  order: MockOrder,
  costos: BusinessData["costos"] = [],
  ecommerce: BusinessData["ecommerce"] = []
): VentaRow[] {
  const fecha = ledgerFecha(order.createdAt, localIsoDate(new Date()));
  const medio = medioFromOrder(order);
  const cliente = order.userName || order.userEmail || "Cliente web";

  return order.items.map((item) => {
    const articulo = itemLabel(item);
    const unitPrice =
      order.paymentMethod === "transferencia"
        ? parseMoney(item.transfer)
        : parseMoney(item.price);
    const total = unitPrice * item.qty;
    const link = resolveVentaArticulo(articulo, costos, ecommerce);
    const costo =
      link.costoUnit != null ? link.costoUnit * item.qty : 0;

    return {
      id: `ven-ord-${order.id}-${item.id || uid("it")}`,
      fecha,
      articulo,
      talle: item.size || null,
      cantidad: item.qty,
      total,
      costo,
      ganancia: total - costo,
      cliente,
      medioPago: medio,
      orderId: order.id,
    };
  });
}

export function ventasToPlanilla(ventas: VentaRow[]): PlanillaRow[] {
  return ventas.map((v) => {
    const buckets = medioToPlanillaBuckets(v.medioPago);
    const total = Number(v.total) || 0;
    return {
      id: v.id.replace(/^ven-/, "pla-"),
      fecha: v.fecha,
      descripcion: planillaDescripcion(v.articulo, v.talle),
      cliente: v.cliente,
      cantidad: v.cantidad,
      costo: v.costo || null,
      ingresoBancario: buckets.ingresoBancario ? total : 0,
      gastoBancario: 0,
      ingresoEfectivo: buckets.ingresoEfectivo ? total : 0,
      gastoEfectivo: 0,
    };
  });
}

function mergePlanilla(
  current: PlanillaRow[],
  incoming: PlanillaRow[]
): PlanillaRow[] {
  const ids = new Set(current.map((r) => r.id));
  const fresh = incoming.filter((r) => !ids.has(r.id));
  if (!fresh.length) return current;
  return [...current, ...fresh];
}

function readBusiness(): BusinessData | null {
  return readJson<BusinessData | null>(BUSINESS_KEY, null);
}

function notifyVentasUpdated(ventas: VentaRow[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BUSINESS_VENTAS_EVENT, { detail: { ventas } })
  );
}

/** Persiste ventas de un pedido en la planilla (localStorage) */
export function appendVentasFromOrder(order: MockOrder): VentaRow[] {
  if (!orderCountsInLedger(order.status)) return [];
  const biz = readBusiness();
  if (!biz) return [];

  const rows = orderToVentas(order, biz.costos, biz.ecommerce);
  const existingIds = new Set(biz.ventas.map((v) => v.id));
  const fresh = rows.filter((r) => !existingIds.has(r.id));
  if (!fresh.length) return [];

  const next: BusinessData = {
    ...biz,
    ventas: [...biz.ventas, ...fresh],
    planilla: mergePlanilla(biz.planilla, ventasToPlanilla(fresh)),
  };
  writeJson(BUSINESS_KEY, next);
  notifyVentasUpdated(fresh);
  return fresh;
}

/**
 * Descuenta stock en la planilla E-commerce (fuente de verdad)
 * según ítems del pedido de la tienda.
 */
export function deductEcommerceFromOrder(order: MockOrder): number {
  if (!orderCountsInLedger(order.status)) return 0;
  const biz = readBusiness();
  if (!biz) return 0;

  let units = 0;
  const byId = new Map(biz.ecommerce.map((r) => [r.id, { ...r, stock: { ...r.stock } }]));

  for (const item of order.items) {
    if (!item.size || !item.qty) continue;
    const row = findEcommerceRow(biz.ecommerce, item.productSlug, item.variantId);
    if (!row) continue;
    const current = byId.get(row.id);
    if (!current) continue;
    const cur = Math.max(0, Math.floor(Number(current.stock[item.size] ?? 0)));
    const next = Math.max(0, cur - item.qty);
    units += cur - next;
    current.stock[item.size] = next;
    byId.set(row.id, current);
  }

  if (!units) return 0;

  writeJson(BUSINESS_KEY, {
    ...biz,
    ecommerce: biz.ecommerce.map((r) => byId.get(r.id) ?? r),
  });
  notifyBusinessChanged();
  return units;
}

function planillaIdOf(ventaId: string): string {
  return String(ventaId).replace(/^ven-/, "pla-");
}

function belongsToOrder(row: { id?: string; orderId?: string | null }, orderId: string): boolean {
  if (row.orderId) return String(row.orderId) === String(orderId);
  return String(row.id || "").startsWith(`ven-ord-${orderId}-`);
}

/** Saca de la planilla un pedido que se canceló. */
export function removeVentasOfOrder(order: MockOrder): number {
  const biz = readBusiness();
  if (!biz) return 0;
  const removed = biz.ventas.filter((v) => belongsToOrder(v, order.id));
  if (!removed.length) return 0;
  const removedIds = new Set(removed.map((v) => v.id));
  const planillaIds = new Set(removed.map((v) => planillaIdOf(v.id)));
  writeJson(BUSINESS_KEY, {
    ...biz,
    ventas: biz.ventas.filter((v) => !removedIds.has(v.id)),
    planilla: biz.planilla.filter((r) => !planillaIds.has(r.id)),
  });
  restoreEcommerceFromOrder(order);
  notifyVentasUpdated([]);
  notifyBusinessChanged();
  return removed.length;
}

function restoreEcommerceFromOrder(order: MockOrder): number {
  const biz = readBusiness();
  if (!biz) return 0;
  let units = 0;
  const byId = new Map(biz.ecommerce.map((r) => [r.id, { ...r, stock: { ...r.stock } }]));
  for (const item of order.items) {
    if (!item.size || !item.qty) continue;
    const row = findEcommerceRow(biz.ecommerce, item.productSlug, item.variantId);
    if (!row) continue;
    const current = byId.get(row.id);
    if (!current) continue;
    const cur = Math.max(0, Math.floor(Number(current.stock[item.size] ?? 0)));
    current.stock[item.size] = cur + item.qty;
    units += item.qty;
    byId.set(row.id, current);
  }
  if (!units) return 0;
  writeJson(BUSINESS_KEY, {
    ...biz,
    ecommerce: biz.ecommerce.map((r) => byId.get(r.id) ?? r),
  });
  return units;
}

/**
 * Importa pedidos de la tienda que aún no están en la planilla Ventas.
 * Útil para compras hechas antes del vínculo.
 */
export function backfillTalleFromOrders(orders: MockOrder[]): number {
  const biz = readBusiness();
  if (!biz) return 0;
  const byItemId = new Map<string, string>();
  const byOrderVariant = new Map<string, string[]>();
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.size) continue;
      byItemId.set(`ven-ord-${order.id}-${item.id}`, item.size);
      const key = `${order.id}::${item.productSlug}::${item.variantId}`;
      const list = byOrderVariant.get(key) ?? [];
      list.push(item.size);
      byOrderVariant.set(key, list);
    }
  }
  let filled = 0;
  const ventas = biz.ventas.map((v) => {
    if (v.talle) return v;
    const byId = byItemId.get(v.id);
    if (byId) {
      filled += 1;
      return { ...v, talle: byId };
    }
    const ord = (v.cliente || "").match(/ORD-\d+/)?.[0] || v.orderId;
    if (!ord) return v;
    const link = resolveVentaArticulo(v.articulo, biz.costos, biz.ecommerce);
    if (!link.slug || !link.variantId) return v;
    const rest = byOrderVariant.get(`${ord}::${link.slug}::${link.variantId}`);
    const size = rest?.shift();
    if (!size) return v;
    filled += 1;
    return { ...v, talle: size };
  });
  if (!filled) return 0;
  writeJson(BUSINESS_KEY, { ...biz, ventas });
  notifyVentasUpdated([]);
  return filled;
}

export function syncShopOrdersToVentas(orders: MockOrder[]): {
  added: number;
  ventas: VentaRow[];
} {
  const biz = readBusiness();
  if (!biz) return { added: 0, ventas: [] };

  const existingIds = new Set(biz.ventas.map((v) => v.id));
  // también evitar duplicar por order id en cliente
  const existingOrderMarks = new Set(
    biz.ventas
      .map((v) => v.orderId || "")
      .filter(Boolean)
  );
  for (const v of biz.ventas) {
    const fromCliente = (v.cliente || "").match(/ORD-\d+/)?.[0];
    if (fromCliente) existingOrderMarks.add(fromCliente);
  }

  const fresh: VentaRow[] = [];
  for (const order of orders) {
    if (!orderCountsInLedger(order.status)) continue;
    if (existingOrderMarks.has(order.id)) continue;
    const rows = orderToVentas(order, biz.costos, biz.ecommerce).filter(
      (r) => !existingIds.has(r.id)
    );
    for (const r of rows) {
      existingIds.add(r.id);
      fresh.push(r);
    }
  }

  if (!fresh.length) return { added: 0, ventas: [] };

  const next: BusinessData = {
    ...biz,
    ventas: [...biz.ventas, ...fresh],
    planilla: mergePlanilla(biz.planilla, ventasToPlanilla(fresh)),
  };
  writeJson(BUSINESS_KEY, next);
  notifyVentasUpdated(fresh);
  return { added: fresh.length, ventas: fresh };
}
