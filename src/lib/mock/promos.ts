import { formatArgentinaDateTime } from "@/lib/argentinaTime";

export type PromoCode = {
  code: string;
  label: string;
  /** Porcentaje 0–100 o monto fijo en ARS */
  type: "percent" | "fixed";
  value: number;
  /** Compra mínima (merchandise) */
  minPurchase?: number;
  /** Un solo uso por usuario */
  oncePerUser?: boolean;
  /** Tope global de usos (pedidos no cancelados) */
  maxUses?: number;
  /** ISO date — opcional */
  expiresAt?: string;
  active?: boolean;
  /** Cupones de campaña no se acumulan con BIEN-* */
  stackWithWelcome?: boolean;
  replacesWelcome?: boolean;
};

export const RETIRED_CAMPAIGN_CODES = ["RASTRO10", "MEGA20"] as const;

/** Seed inicial (también fallback si no hay localStorage). */
export const SEED_PROMO_CODES: PromoCode[] = [
  {
    code: "BIENVENIDA",
    label: "10% OFF de bienvenida",
    type: "percent",
    value: 10,
    oncePerUser: true,
    minPurchase: 0,
  },
];

/** @deprecated preferí `promos` del store; queda para páginas estáticas */
export const PROMO_CODES = SEED_PROMO_CODES;

export function findPromo(
  code: string,
  catalog: PromoCode[] = SEED_PROMO_CODES
): PromoCode | null {
  const normalized = code.trim().toUpperCase();
  return catalog.find((p) => p.code === normalized) ?? null;
}

/** El % o monto fijo se calcula sobre el total de mercadería que llega acá
 * (precio transferencia si el medio de pago es transferencia, lista si es MP). */
export function calcPromoDiscount(
  promo: PromoCode | null,
  merchandiseTotal: number
): number {
  if (!promo) return 0;
  if (promo.type === "percent") {
    return Math.round((merchandiseTotal * promo.value) / 100);
  }
  return Math.min(promo.value, merchandiseTotal);
}

export type PromoValidation =
  | { ok: true; promo: PromoCode }
  | { ok: false; error: string };

export function validatePromo(
  code: string,
  opts: {
    merchandise: number;
    userId?: string | null;
    orders?: { userId: string; promoCode?: string; status: string }[];
    catalog?: PromoCode[];
  }
): PromoValidation {
  const promo = findPromo(code, opts.catalog ?? SEED_PROMO_CODES);
  if (!promo || promo.active === false) {
    return { ok: false, error: "Cupón inválido" };
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return { ok: false, error: "Este cupón venció" };
  }
  if (promo.minPurchase && opts.merchandise < promo.minPurchase) {
    return {
      ok: false,
      error: `Mínimo de compra $${promo.minPurchase.toLocaleString("es-AR")}`,
    };
  }
  const orders = (opts.orders ?? []).filter((o) => o.status !== "cancelado");
  if (/^BIEN-/.test(promo.code) && opts.userId) {
    const prior = orders.some((o) => String(o.userId) === String(opts.userId));
    if (prior) {
      return { ok: false, error: "Ese cupón ya lo usaste" };
    }
  }
  if (promo.maxUses != null) {
    const used = orders.filter((o) => o.promoCode === promo.code).length;
    if (used >= promo.maxUses) {
      return { ok: false, error: "Cupón agotado" };
    }
  }
  if (promo.oncePerUser && opts.userId) {
    const usedByUser = orders.some(
      (o) => o.userId === opts.userId && o.promoCode === promo.code
    );
    if (usedByUser) {
      return { ok: false, error: "Ya usaste este cupón" };
    }
  }
  const stacked: PromoCode = { ...promo };
  if (!/^BIEN-/.test(promo.code) && opts.userId) {
    const hasWelcome = (opts.catalog ?? []).some(
      (p) => /^BIEN-/.test(p.code) && p.active !== false
    );
    if (hasWelcome) stacked.replacesWelcome = true;
  }
  return { ok: true, promo: stacked };
}

export function promoRulesText(p: PromoCode): string[] {
  const rules: string[] = [];
  if (p.minPurchase)
    rules.push(`Mín. $${p.minPurchase.toLocaleString("es-AR")}`);
  if (p.oncePerUser) rules.push("1 uso / usuario");
  if (p.maxUses != null) rules.push(`Máx. ${p.maxUses} usos`);
  if (/^BIEN-/.test(p.code)) rules.push("No acumulable con otros cupones");
  else if (p.stackWithWelcome === false || p.stackWithWelcome == null)
    rules.push("No acumulable con bienvenida");
  if (p.expiresAt)
    rules.push(`Vence ${formatArgentinaDateTime(p.expiresAt)} ART`);
  if (p.active === false) rules.push("Inactivo");
  if (!rules.length) rules.push("Sin restricciones extra");
  return rules;
}
