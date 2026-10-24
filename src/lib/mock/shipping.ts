import type { SelectedShippingRate, ShippingZone } from "@/lib/mock/types";

export type ShippingQuote = {
  zone: ShippingZone;
  label: string;
  cost: number;
  eta: string;
};

export const FREE_SHIPPING_FROM = 150_000;

export const HOLIDAYS_NOTE =
  "El tiempo de entrega no considera feriados.";

export function isFreeShipping(merchandiseTotal: number) {
  return merchandiseTotal >= FREE_SHIPPING_FROM;
}

function normalizeCp(value: string | null | undefined): string {
  return String(value || "").replace(/\D/g, "").slice(0, 4);
}

/** Cotización de interior todavía usable para este carrito/CP. */
export function isInteriorRateValid(
  rate: SelectedShippingRate | null | undefined,
  options: {
    packages: number;
    postalCode: string;
    now?: number;
    /** Con envío gratis el backend no cobra la cotización; alcanza CP/pares. */
    ignoreExpiry?: boolean;
  }
): rate is SelectedShippingRate {
  if (!rate) return false;
  const packages = Math.min(
    30,
    Math.max(1, Math.floor(Number(options.packages) || 1))
  );
  if (Number(rate.packages) !== packages) return false;
  if (!rate.quoteId && !rate.id) return false;
  const rateCp = normalizeCp(rate.postalCode);
  const cartCp = normalizeCp(options.postalCode);
  if (rateCp && cartCp && rateCp !== cartCp) return false;
  if (!options.ignoreExpiry && rate.expiresAt) {
    const ends = new Date(rate.expiresAt).getTime();
    if (!Number.isFinite(ends) || ends <= (options.now ?? Date.now())) {
      return false;
    }
  }
  return true;
}

/** Costos mock de envío (ARS). Envío gratis desde $150.000 en Rosario e interior. */
export function quoteShipping(
  zone: ShippingZone,
  merchandiseTotal: number
): ShippingQuote {
  if (zone === "retiro") {
    return {
      zone,
      label: "Retiro en punto",
      cost: 0,
      eta: `Listo en 24–48 hs hábiles. ${HOLIDAYS_NOTE}`,
    };
  }

  const free = isFreeShipping(merchandiseTotal);

  if (zone === "rosario") {
    return {
      zone,
      label: free ? "Envío gratis (Rosario)" : "Envío Rosario",
      cost: free ? 0 : 3_500,
      eta: `Una vez aprobado el pago, nos vamos a comunicar con vos, para pactar el día y horario de entrega. ${HOLIDAYS_NOTE}`,
    };
  }

  return {
    zone,
    label: free ? "Envío gratis (interior)" : "Envío al interior",
    cost: free ? 0 : 8_900,
    eta: `3 a 7 días hábiles según destino. ${HOLIDAYS_NOTE}`,
  };
}
