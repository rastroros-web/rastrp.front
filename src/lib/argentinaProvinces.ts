import type { SelectOption } from "@/components/ui/FancySelect";

export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type ArgentinaProvince = (typeof ARGENTINA_PROVINCES)[number];

export const argentinaProvinceOptions: SelectOption[] = ARGENTINA_PROVINCES.map(
  (province) => ({
    value: province,
    label: province,
  })
);

function normalizeProvinceKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function matchArgentinaProvince(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const key = normalizeProvinceKey(raw);
  const match = ARGENTINA_PROVINCES.find(
    (province) => normalizeProvinceKey(province) === key
  );
  return match ?? raw;
}
