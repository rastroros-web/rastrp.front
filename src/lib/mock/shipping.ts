import type { ShippingZone } from "@/lib/mock/types";

export type ShippingQuote = {
  zone: ShippingZone;
  label: string;
  cost: number;
  eta: string;
};

export const FREE_SHIPPING_FROM = 150_000;

export const HOLIDAYS_NOTE =
  "El tiempo de entrega no considera feriados.";

/** Corte para envío en el día dentro de Rosario (hora de Buenos Aires). */
export const ROSARIO_SAME_DAY_CUTOFF_HOUR = 12;

export function rosarioNow() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
    })
  );
}

/** Si pedís antes de las 12 pm en día hábil, el pedido llega en el día. */
export function isRosarioSameDayWindow(now = rosarioNow()) {
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  return isWeekday && now.getHours() < ROSARIO_SAME_DAY_CUTOFF_HOUR;
}

export function isFreeShipping(merchandiseTotal: number) {
  return merchandiseTotal >= FREE_SHIPPING_FROM;
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
      eta: `En el día (si pedís antes de las 12 pm) o 24–48 hs. ${HOLIDAYS_NOTE}`,
    };
  }

  return {
    zone,
    label: free ? "Envío gratis (interior)" : "Envío al interior",
    cost: free ? 0 : 8_900,
    eta: `3 a 7 días hábiles según destino. ${HOLIDAYS_NOTE}`,
  };
}
