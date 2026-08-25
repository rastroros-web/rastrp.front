import { collapseLabel, ledgerFecha, planillaDescripcion } from "@/lib/mock/orderLabels";

export type SizeStock = Record<string, number>;

export type GastoPago = {
  id: string;
  pago: string | null;
  fecha: string | null;
  descripcion: string | null;
  receptor: string | null;
  real: number | null;
  cotizacion: number | null;
  pesos: number;
};

export type GastoFijo = {
  id: string;
  area: string;
  nombre: string;
  montoMensual: number;
};

export type GastoMensual = {
  id: string;
  concepto: string;
  enero: number;
  febrero?: number;
  marzo?: number;
};

export type GastosMensualesIngresos = {
  enero: number;
  febrero: number;
  marzo: number;
};

/** Saldos de apertura de PLANILLA DIARIA (fila 2 del Excel) */
export type PlanillaApertura = {
  saldoBancario: number;
  saldoEfectivo: number;
  /** Columna L del Excel: segundo “SALDO BANCARIO” */
  saldoBancarioAlt: number;
};

/** Arranque en cero: los saldos se cargan desde la página, no vienen del Excel. */
export const PLANILLA_APERTURA: PlanillaApertura = {
  saldoBancario: 0,
  saldoEfectivo: 0,
  saldoBancarioAlt: 0,
};

export const GASTOS_MENSUALES_INGRESOS_DEFAULT: GastosMensualesIngresos = {
  enero: 0,
  febrero: 0,
  marzo: 0,
};

export type VentaRow = {
  id: string;
  fecha: string | null;
  articulo: string;
  /** Talle vendido (ej. "38"). La hoja VENTAS del Excel no lo trae; lo usamos para la tienda. */
  talle?: string | null;
  cantidad: number;
  total: number;
  costo: number;
  ganancia: number | null;
  cliente: string | null;
  medioPago: string | null;
  /** Pedido de la tienda que originó la fila, si aplica */
  orderId?: string | null;
};

export type CostoRow = {
  id: string;
  marca: string;
  modelo: string;
  /** Columna CODIGO SKU del Excel. En esta hoja no hay color. */
  sku: string | null;
  color?: string | null;
  grada: string | null;
  calidad: string | null;
  cantidadXCaja: number | null;
  costoReal: string | number | null;
  cotizacion: number | null;
  costoArs: number | null;
  pasEnvio: number | null;
  costoFinal: number | null;
  valorPublico: number | null;
  ganancia: number | null;
  stock: SizeStock;
};

export type PlanillaRow = {
  id: string;
  fecha: string | null;
  descripcion: string;
  cliente: string | null;
  cantidad: number | null;
  costo: number | null;
  ingresoBancario: number;
  gastoBancario: number;
  ingresoEfectivo: number;
  gastoEfectivo: number;
};

export type CajaSnapshot = {
  id: string;
  fecha: string | null;
  efectivo: number;
  personalPay: number;
  total: number;
};

export type TalleMedida = {
  id: string;
  modelo: string;
  medidas: Record<string, string | number | null>;
};

export type EcommerceRow = {
  id: string;
  estado: string;
  marca: string;
  modelo: string;
  color: string;
  precioEfTr: number;
  precioWeb: number;
  peso: string;
  dimensiones: string;
  estilo: string;
  linkFotos: string | null;
  descripcion: string;
  categorias: string;
  stock: SizeStock;
  tipo: "zapatilla" | "otro" | string;
};

export type BusinessData = {
  version: number;
  source: string;
  gastos: GastoPago[];
  gastosFijos: GastoFijo[];
  gastosMensuales: GastoMensual[];
  gastosMensualesIngresos?: GastosMensualesIngresos;
  planillaApertura?: PlanillaApertura;
  ventas: VentaRow[];
  costos: CostoRow[];
  /** Hoja vieja de códigos: se ignora al cargar y siempre queda vacía. */
  codigos: unknown[];
  planilla: PlanillaRow[];
  caja: CajaSnapshot[];
  talles: TalleMedida[];
  ecommerce: EcommerceRow[];
};

/**
 * El Excel viejo queda en `src/data/business.seed.json` sólo como muestra de la
 * estructura: no se importa acá para no arrastrar 200 KB al bundle del cliente.
 */

/** Versión del libro nuevo. Debe coincidir con `emptyBook()` del backend. */
export const BUSINESS_VERSION = 6;

/** Libro nuevo: mismas hojas que el Excel, sin filas ni saldos precargados. */
export function emptyBusiness(): BusinessData {
  return {
    version: BUSINESS_VERSION,
    source: "Rastro",
    gastos: [],
    gastosFijos: [],
    gastosMensuales: [],
    gastosMensualesIngresos: { ...GASTOS_MENSUALES_INGRESOS_DEFAULT },
    planillaApertura: { ...PLANILLA_APERTURA },
    ventas: [],
    costos: [],
    codigos: [],
    planilla: [],
    caja: [],
    talles: [],
    ecommerce: [],
  };
}

function omitLegacyCodeField<T extends object>(row: T): T {
  const copy = { ...(row as T & { sku?: unknown }) };
  delete copy.sku;
  return copy;
}

export function normalizeBusiness(data: BusinessData): BusinessData {
  return {
    ...data,
    costos: (data.costos || []).map((row) => ({
      ...row,
      sku: row.sku ?? null,
      color: row.color ?? null,
    })),
    ventas: (data.ventas || []).map((row) => ({
      ...row,
      fecha:
        row.fecha == null || row.fecha === ""
          ? row.fecha
          : ledgerFecha(row.fecha),
      articulo: collapseLabel(row.articulo),
    })),
    planilla: (data.planilla || []).map((row) => ({
      ...row,
      fecha:
        row.fecha == null || row.fecha === ""
          ? row.fecha
          : ledgerFecha(row.fecha),
      descripcion: planillaDescripcion(row.descripcion),
    })),
    ecommerce: (data.ecommerce || []).map(
      (row) => omitLegacyCodeField(row) as EcommerceRow
    ),
    codigos: [],
    gastosMensuales: (data.gastosMensuales || []).map((row) => ({
      ...row,
      enero: Number(row.enero) || 0,
      febrero: Number(row.febrero) || 0,
      marzo: Number(row.marzo) || 0,
    })),
    gastosMensualesIngresos: {
      enero:
        data.gastosMensualesIngresos?.enero ??
        GASTOS_MENSUALES_INGRESOS_DEFAULT.enero,
      febrero: data.gastosMensualesIngresos?.febrero ?? 0,
      marzo: data.gastosMensualesIngresos?.marzo ?? 0,
    },
    planillaApertura: {
      saldoBancario:
        data.planillaApertura?.saldoBancario ?? PLANILLA_APERTURA.saldoBancario,
      saldoEfectivo:
        data.planillaApertura?.saldoEfectivo ?? PLANILLA_APERTURA.saldoEfectivo,
      saldoBancarioAlt:
        data.planillaApertura?.saldoBancarioAlt ??
        PLANILLA_APERTURA.saldoBancarioAlt,
    },
  };
}

export function isEmptyBusinessBook(data: BusinessData | null | undefined): boolean {
  if (!data) return true;
  return (
    !(data.ventas?.length) &&
    !(data.costos?.length) &&
    !(data.ecommerce?.length) &&
    !(data.gastos?.length)
  );
}

export function cloneBusiness(data: BusinessData = emptyBusiness()): BusinessData {
  return normalizeBusiness(structuredClone(data));
}

export function sumField<T>(rows: T[], pick: (r: T) => number): number {
  return rows.reduce((s, r) => s + (pick(r) || 0), 0);
}
