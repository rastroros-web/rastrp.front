import type {
  BusinessData,
  CostoRow,
  EcommerceRow,
  GastoPago,
  VentaRow,
} from "@/lib/mock/business";
import { ledgerFecha } from "@/lib/mock/orderLabels";
import { withPlanillaSaldos } from "@/lib/mock/sheetCols";
import { costoForSheetRow } from "@/lib/mock/sheetMatch";

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** La hoja VENTAS trae fechas reales, celdas vacías y texto suelto ("al costo lu"). */
export function parseSheetDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = ledgerFecha(value);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const name = MONTH_LABELS[Number(month) - 1] || month;
  return `${name} ${year}`;
}

export type DatedVenta = VentaRow & {
  date: Date | null;
  monthKey: string | null;
  gananciaCalc: number;
};

/**
 * En el Excel una fecha vale para todas las filas siguientes hasta la próxima fecha,
 * y la columna GANANCIA quedó sin fórmula: se recalcula como total − costo.
 */
export function datedVentas(ventas: VentaRow[]): DatedVenta[] {
  let lastDate: Date | null = null;
  return ventas.map((venta) => {
    const parsed = parseSheetDate(venta.fecha);
    if (parsed) lastDate = parsed;
    const date = parsed ?? lastDate;
    const total = Number(venta.total) || 0;
    const costo = Number(venta.costo) || 0;
    const ganancia =
      venta.ganancia == null || Number.isNaN(Number(venta.ganancia))
        ? total - costo
        : Number(venta.ganancia);
    return {
      ...venta,
      date,
      monthKey: date ? monthKeyOf(date) : null,
      gananciaCalc: ganancia,
    };
  });
}

export function datedGastos(gastos: GastoPago[]) {
  let lastDate: Date | null = null;
  return gastos.map((gasto) => {
    const parsed = parseSheetDate(gasto.fecha);
    if (parsed) lastDate = parsed;
    const date = parsed ?? lastDate;
    return {
      ...gasto,
      date,
      monthKey: date ? monthKeyOf(date) : null,
      pesos: Number(gasto.pesos) || 0,
    };
  });
}

export function availableMonths(data: BusinessData): string[] {
  const keys = new Set<string>();
  for (const venta of datedVentas(data.ventas || [])) {
    if (venta.monthKey) keys.add(venta.monthKey);
  }
  for (const gasto of datedGastos(data.gastos || [])) {
    if (gasto.monthKey) keys.add(gasto.monthKey);
  }
  return [...keys].sort().reverse();
}

function normalizeArticulo(raw: string): string {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function medioLabel(raw: string | null | undefined): string {
  const value = String(raw || "").toLowerCase();
  if (!value.trim()) return "Sin registrar";
  if (value.includes("efectivo")) return "Efectivo";
  if (value.includes("transfer")) return "Transferencia";
  if (value.includes("mercado")) return "Mercado Pago";
  if (value.includes("personal")) return "Personal Pay";
  return raw as string;
}

export type PeriodSummary = {
  ventas: number;
  costo: number;
  ganancia: number;
  unidades: number;
  operaciones: number;
  ticket: number;
  margen: number;
  gastos: number;
  flujo: number;
  /** Ventas cargadas sin costo: inflan la ganancia y el margen. */
  sinCosto: number;
  facturadoSinCosto: number;
};

/**
 * `flujo` es ventas − gastos, no ganancia − gastos: la hoja GASTOSPAGOS es
 * mayormente compra de mercadería, que ya está descontada dentro de la ganancia.
 * Restarla de nuevo contaría el costo dos veces.
 */
export function summarize(ventas: DatedVenta[], gastos: number): PeriodSummary {
  const total = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0);
  const costo = ventas.reduce((s, v) => s + (Number(v.costo) || 0), 0);
  const ganancia = ventas.reduce((s, v) => s + v.gananciaCalc, 0);
  const unidades = ventas.reduce((s, v) => s + (Number(v.cantidad) || 0), 0);
  const sinCostoRows = ventas.filter((v) => !(Number(v.costo) || 0));
  return {
    ventas: total,
    costo,
    ganancia,
    unidades,
    operaciones: ventas.length,
    ticket: ventas.length ? total / ventas.length : 0,
    margen: total > 0 ? (ganancia / total) * 100 : 0,
    gastos,
    flujo: total - gastos,
    sinCosto: sinCostoRows.length,
    facturadoSinCosto: sinCostoRows.reduce(
      (s, v) => s + (Number(v.total) || 0),
      0
    ),
  };
}

export type MonthRow = {
  monthKey: string;
  label: string;
  ventas: number;
  costo: number;
  ganancia: number;
  unidades: number;
  gastos: number;
  margen: number;
  sinCosto: number;
};

export function monthlyBreakdown(data: BusinessData): MonthRow[] {
  const byMonth = new Map<string, MonthRow>();
  const touch = (key: string): MonthRow => {
    const found = byMonth.get(key);
    if (found) return found;
    const row: MonthRow = {
      monthKey: key,
      label: monthLabel(key),
      ventas: 0,
      costo: 0,
      ganancia: 0,
      unidades: 0,
      gastos: 0,
      margen: 0,
      sinCosto: 0,
    };
    byMonth.set(key, row);
    return row;
  };

  for (const venta of datedVentas(data.ventas || [])) {
    if (!venta.monthKey) continue;
    const row = touch(venta.monthKey);
    row.ventas += Number(venta.total) || 0;
    row.costo += Number(venta.costo) || 0;
    row.ganancia += venta.gananciaCalc;
    row.unidades += Number(venta.cantidad) || 0;
    if (!(Number(venta.costo) || 0)) row.sinCosto += 1;
  }
  for (const gasto of datedGastos(data.gastos || [])) {
    if (!gasto.monthKey) continue;
    touch(gasto.monthKey).gastos += gasto.pesos;
  }

  return [...byMonth.values()]
    .map((row) => ({
      ...row,
      margen: row.ventas > 0 ? (row.ganancia / row.ventas) * 100 : 0,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export type ModeloRow = {
  articulo: string;
  unidades: number;
  ventas: number;
  ganancia: number;
};

export function topModelos(ventas: DatedVenta[], limit = 8): ModeloRow[] {
  const byModelo = new Map<string, ModeloRow>();
  for (const venta of ventas) {
    const articulo = normalizeArticulo(venta.articulo);
    if (!articulo) continue;
    const row = byModelo.get(articulo) || {
      articulo,
      unidades: 0,
      ventas: 0,
      ganancia: 0,
    };
    row.unidades += Number(venta.cantidad) || 0;
    row.ventas += Number(venta.total) || 0;
    row.ganancia += venta.gananciaCalc;
    byModelo.set(articulo, row);
  }
  return [...byModelo.values()]
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, limit);
}

export type MedioRow = { medio: string; total: number; operaciones: number };

export function porMedioDePago(ventas: DatedVenta[]): MedioRow[] {
  const byMedio = new Map<string, MedioRow>();
  for (const venta of ventas) {
    const medio = medioLabel(venta.medioPago);
    const row = byMedio.get(medio) || { medio, total: 0, operaciones: 0 };
    row.total += Number(venta.total) || 0;
    row.operaciones += 1;
    byMedio.set(medio, row);
  }
  return [...byMedio.values()].sort((a, b) => b.total - a.total);
}

function pairsOf(stock: Record<string, number>): number {
  return Object.values(stock || {}).reduce(
    (sum, qty) => sum + (Number(qty) || 0),
    0
  );
}

export type StockValuation = {
  pares: number;
  variantes: number;
  valorVenta: number;
  valorCosto: number;
  potencial: number;
  /** Variantes con stock que no tienen costo cargado en la hoja COSTOS. */
  sinCosto: number;
};

/**
 * Stock del catálogo e-commerce valuado a precio de transferencia y al costo final
 * de la hoja COSTOS (match por marca + modelo + color).
 */
export function valuarStock(
  ecommerce: EcommerceRow[],
  costos: CostoRow[]
): StockValuation {
  let pares = 0;
  let variantes = 0;
  let valorVenta = 0;
  let valorCosto = 0;
  let sinCosto = 0;

  for (const row of ecommerce || []) {
    const cantidad = pairsOf(row.stock);
    if (cantidad <= 0) continue;
    pares += cantidad;
    variantes += 1;
    valorVenta += cantidad * (Number(row.precioEfTr) || 0);
    const costo = costoForSheetRow(row, costos);
    if (costo == null) sinCosto += 1;
    else valorCosto += cantidad * costo;
  }

  return {
    pares,
    variantes,
    valorVenta,
    valorCosto,
    potencial: valorVenta - valorCosto,
    sinCosto,
  };
}

export type SaldosActuales = {
  bancario: number;
  efectivo: number;
  total: number;
};

export function saldosActuales(data: BusinessData): SaldosActuales {
  const rows = withPlanillaSaldos(data.planilla || [], data.planillaApertura);
  const last = rows[rows.length - 1];
  const bancario = last
    ? last.saldoBancario
    : data.planillaApertura?.saldoBancario ?? 0;
  const efectivo = last
    ? last.saldoEfectivo
    : data.planillaApertura?.saldoEfectivo ?? 0;
  return { bancario, efectivo, total: bancario + efectivo };
}
