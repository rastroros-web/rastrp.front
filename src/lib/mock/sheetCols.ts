import type { GastoPago, PlanillaApertura, PlanillaRow } from "@/lib/mock/business";
import { PLANILLA_APERTURA } from "@/lib/mock/business";

/** Talles de planilla Excel (COSTOS / E-COMMERCE / TALLES) */
export const SHEET_SIZES = [
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
] as const;

export const MONTHS = ["enero", "febrero", "marzo"] as const;
export type MonthKey = (typeof MONTHS)[number];

export function cell(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

export function moneyOrDash(
  v: number | null | undefined,
  format: (n: number) => string
): string {
  if (v == null || Number.isNaN(v)) return "—";
  return format(v);
}

/** Columna H GASTOSPAGOS: acumulado de PESOS (como el Excel) */
export function withGastoTotal(rows: GastoPago[]) {
  let acc = 0;
  return rows.map((row) => {
    acc += Number(row.pesos) || 0;
    return { ...row, gastoTotal: acc };
  });
}

export type PlanillaWithSaldo = PlanillaRow & {
  saldoBancario: number;
  saldoEfectivo: number;
  saldoBancarioAlt: number;
};

/**
 * Saldos corridos de PLANILLA DIARIA:
 * H = Hprev + ingreso bancario − gasto bancario
 * K = Kprev + ingreso efectivo − gasto efectivo
 * L = Lprev + ingreso bancario − gasto bancario
 *
 * En el Excel la columna L arrastraba `gasto bancario − gasto efectivo`, que sumaba
 * los gastos al saldo en vez de restarlos. Se corrige acá para que L sea un saldo.
 */
export function withPlanillaSaldos(
  rows: PlanillaRow[],
  apertura: PlanillaApertura = PLANILLA_APERTURA
): PlanillaWithSaldo[] {
  let h = Number(apertura.saldoBancario) || 0;
  let k = Number(apertura.saldoEfectivo) || 0;
  let l = Number(apertura.saldoBancarioAlt) || 0;
  return rows.map((row) => {
    const ingB = Number(row.ingresoBancario) || 0;
    const gasB = Number(row.gastoBancario) || 0;
    const ingE = Number(row.ingresoEfectivo) || 0;
    const gasE = Number(row.gastoEfectivo) || 0;
    h += ingB - gasB;
    k += ingE - gasE;
    l += ingB - gasB;
    return {
      ...row,
      saldoBancario: h,
      saldoEfectivo: k,
      saldoBancarioAlt: l,
    };
  });
}

export function medioToPlanillaBuckets(medioPago: string | null | undefined): {
  ingresoBancario: number;
  ingresoEfectivo: number;
} {
  const m = String(medioPago || "").toLowerCase();
  if (m.includes("efectivo")) {
    return { ingresoBancario: 0, ingresoEfectivo: 1 };
  }
  return { ingresoBancario: 1, ingresoEfectivo: 0 };
}
