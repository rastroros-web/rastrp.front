/** Tablas mock por marca / género (cm de plantilla → talle AR). */

export type SizeGender = "mujer" | "hombre" | "unisex";

export type SizeRow = {
  cmMin: number;
  cmMax: number;
  size: string;
};

export type BrandSizeChart = {
  brand: string;
  gender: SizeGender;
  note: string;
  rows: SizeRow[];
};

export const SIZE_CHARTS: BrandSizeChart[] = [
  {
    brand: "Nike",
    gender: "mujer",
    note: "Nike mujer suele calzar al talle. Si estás entre dos, andá al más chico.",
    rows: [
      { cmMin: 22.5, cmMax: 23.0, size: "35" },
      { cmMin: 23.0, cmMax: 23.5, size: "36" },
      { cmMin: 23.5, cmMax: 24.0, size: "37" },
      { cmMin: 24.0, cmMax: 24.5, size: "38" },
      { cmMin: 24.5, cmMax: 25.0, size: "39" },
      { cmMin: 25.0, cmMax: 25.5, size: "40" },
      { cmMin: 25.5, cmMax: 26.0, size: "41" },
    ],
  },
  {
    brand: "Nike",
    gender: "hombre",
    note: "Nike hombre: si tenés pie ancho, sumá medio talle cuando exista.",
    rows: [
      { cmMin: 24.5, cmMax: 25.0, size: "39" },
      { cmMin: 25.0, cmMax: 25.5, size: "40" },
      { cmMin: 25.5, cmMax: 26.0, size: "41" },
      { cmMin: 26.0, cmMax: 26.5, size: "42" },
      { cmMin: 26.5, cmMax: 27.0, size: "43" },
      { cmMin: 27.0, cmMax: 27.5, size: "44" },
      { cmMin: 27.5, cmMax: 28.2, size: "45" },
    ],
  },
  {
    brand: "Adidas",
    gender: "unisex",
    note: "Samba / Campus suelen calzar justos. Si dudás, subí medio talle.",
    rows: [
      { cmMin: 22.8, cmMax: 23.3, size: "36" },
      { cmMin: 23.3, cmMax: 23.8, size: "37" },
      { cmMin: 23.8, cmMax: 24.4, size: "38" },
      { cmMin: 24.4, cmMax: 25.0, size: "39" },
      { cmMin: 25.0, cmMax: 25.6, size: "40" },
      { cmMin: 25.6, cmMax: 26.2, size: "41" },
      { cmMin: 26.2, cmMax: 26.8, size: "42" },
      { cmMin: 26.8, cmMax: 27.4, size: "43" },
      { cmMin: 27.4, cmMax: 28.0, size: "44" },
    ],
  },
  {
    brand: "Vans",
    gender: "unisex",
    note: "Old Skool / Ultrarange: talle real. Pie ancho → un talle más.",
    rows: [
      { cmMin: 23.0, cmMax: 23.5, size: "36" },
      { cmMin: 23.5, cmMax: 24.0, size: "37" },
      { cmMin: 24.0, cmMax: 24.5, size: "38" },
      { cmMin: 24.5, cmMax: 25.1, size: "39" },
      { cmMin: 25.1, cmMax: 25.7, size: "40" },
      { cmMin: 25.7, cmMax: 26.3, size: "41" },
      { cmMin: 26.3, cmMax: 26.9, size: "42" },
      { cmMin: 26.9, cmMax: 27.5, size: "43" },
    ],
  },
  {
    brand: "New Balance",
    gender: "unisex",
    note: "NB suele ser más amplio. Si calzás justas en Nike, mantené el mismo talle.",
    rows: [
      { cmMin: 23.0, cmMax: 23.6, size: "37" },
      { cmMin: 23.6, cmMax: 24.2, size: "38" },
      { cmMin: 24.2, cmMax: 24.8, size: "39" },
      { cmMin: 24.8, cmMax: 25.4, size: "40" },
      { cmMin: 25.4, cmMax: 26.0, size: "41" },
      { cmMin: 26.0, cmMax: 26.6, size: "42" },
      { cmMin: 26.6, cmMax: 27.2, size: "43" },
      { cmMin: 27.2, cmMax: 28.0, size: "44" },
    ],
  },
];

export function suggestSize(
  chart: BrandSizeChart,
  cm: number
): { size: string; exact: boolean } | null {
  const hit = chart.rows.find((r) => cm >= r.cmMin && cm <= r.cmMax);
  if (hit) return { size: hit.size, exact: true };
  if (cm < chart.rows[0].cmMin) return { size: chart.rows[0].size, exact: false };
  const last = chart.rows[chart.rows.length - 1];
  if (cm > last.cmMax) return { size: last.size, exact: false };
  return null;
}

export const SIZE_BRANDS = [...new Set(SIZE_CHARTS.map((c) => c.brand))];
