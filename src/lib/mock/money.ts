/** Parse "$64.000,00" → 64000 */
export function parseMoney(value: string | null | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Format 64000 → "$64.000,00" */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const INSTALLMENT_COUNT = 3;

export function transferFromPrice(price: string): string {
  const n = parseMoney(price);
  return formatMoney(n * 0.75);
}

export function installmentFromPrice(
  price: string,
  cuotas = INSTALLMENT_COUNT
): string {
  const n = parseMoney(price);
  return formatMoney(n / cuotas);
}

export function installmentLabelFromPrice(
  price: string,
  cuotas = INSTALLMENT_COUNT
): string {
  return `${cuotas} cuotas de ${installmentFromPrice(price, cuotas)}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
