import { slugify } from "@/lib/mock/money";

export function normKey(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function catalogTargetFromSheet(row: {
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
}): { slug: string; variantId: string } | null {
  const marca = String(row.marca || "").trim();
  const modelo = String(row.modelo || "").trim();
  const color = String(row.color || "").trim();
  if (!marca || !modelo || !color) return null;
  return {
    slug: slugify(`${marca}-${modelo}`),
    variantId: slugify(color),
  };
}

export function matchSheetRow<
  T extends { marca?: string | null; modelo?: string | null; color?: string | null },
>(
  rows: T[] | null | undefined,
  needle: { marca?: string | null; modelo?: string | null; color?: string | null }
): T | undefined {
  const modelo = normKey(needle.modelo);
  if (!modelo) return undefined;
  const color = normKey(needle.color);
  const marca = normKey(needle.marca);

  return (rows || []).find((row) => {
    if (normKey(row.modelo) !== modelo) return false;
    if (marca && row.marca && normKey(row.marca) !== marca) return false;
    if (color && row.color && normKey(row.color) !== color) return false;
    return true;
  });
}

export function costoForSheetRow(
  needle: { marca?: string | null; modelo?: string | null; color?: string | null },
  costos: { marca?: string | null; modelo?: string | null; color?: string | null; costoFinal?: number | null }[]
): number | null {
  const hit = matchSheetRow(costos, needle);
  const value = Number(hit?.costoFinal);
  return Number.isFinite(value) && value > 0 ? value : null;
}
