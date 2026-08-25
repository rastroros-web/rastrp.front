import type { CostoRow } from "@/lib/mock/business";
import raw from "@/data/costos.seed.json";

/** Hoja COSTOS de `Rastro - General.xlsx`, sin filas vacías. */
export const EXCEL_COSTOS = raw as CostoRow[];

export function withExcelCostosIfEmpty<T extends { costos: CostoRow[] }>(
  book: T
): T {
  if (book.costos?.length) return book;
  return { ...book, costos: EXCEL_COSTOS.map((row) => ({ ...row })) };
}
