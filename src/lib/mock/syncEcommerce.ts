import type { CatalogProduct, ColorVariant, ProductSize } from "@/data/catalog";
import { stripSizeChartImages } from "@/data/catalog";
import driveImagesMap from "@/data/drive-images.json";
import type { EcommerceRow } from "@/lib/mock/business";
import {
  formatMoney,
  installmentLabelFromPrice,
  INSTALLMENT_COUNT,
  slugify,
} from "@/lib/mock/money";
import type { ShopProduct } from "@/lib/mock/types";
import { normalizeProductStock } from "@/lib/mock/stock";
import { catalogTargetFromSheet } from "@/lib/mock/sheetMatch";

const DRIVE_IMAGES = driveImagesMap as Record<string, string[]>;

/**
 * Carpetas ya descargadas en public/assets/products/drive.
 * La identidad del producto es marca+modelo+color; estos nombres son
 * históricos de las carpetas, no se usan en el libro ni en la tienda.
 */
const DRIVE_FOLDER_BY_TARGET: Record<string, string> = {
  "vans-ultrarange::black": "VAN-ULT-NEG",
  "vans-ultrarange::verde-militar": "VAN-ULT-VMI",
  "vans-vr3::black": "VAN-VR3-NEG",
  "vans-vr3::beige": "VAN-VR3-BEI",
  "vans-old-skool::blanck": "VAN-OSK-NEG",
  "vans-old-skool::arena": "VAN-OSK-ARE",
  "vans-old-skool::total-black": "VAN-OSK-TBL",
  "vans-hylane::black": "VAN-HYL-NEG",
  "nike-air-force-1::gris": "NIK-AF1-GRI",
  "nike-air-force-1::white": "NIK-AF1-WHI",
  "nike-air-force-1::total-black": "NIK-AF1-TBL",
  "nike-air-force-1::caramelo": "NIK-AF1-CAR",
  "nike-dunk-low::panda": "NIK-DNK-PAN",
  "nike-jordan-1-low-azul::nico": "NIK-J1L-AZL",
  "nike-sb-black::nico": "NIK-CSB-NEG",
  "adidas-samba::classic": "ADI-SAM-CLA",
  "adidas-samba::black": "ADI-SAM-BLA",
  "adidas-samba::caramelo": "ADI-SAM-CAR",
  "adidas-samba::chocolate": "ADI-SAM-CHO",
  "adidas-samba::beige-tex": "ADI-SAM-TXB",
  "adidas-samba::rosa-tex": "ADI-SAM-TXR",
  "adidas-samba::v-chocolate": "ADI-SAM-VCH",
  "adidas-samba::green": "ADI-SAM-VVE",
  "adidas-samba::black-off": "ADI-SAM-VNO",
  "adidas-samba::cherry": "ADI-SAM-CHE",
  "adidas-samba-ballet::nico": "ADI-SBL-CLA",
  "adidas-samba-ballet::black": "ADI-SBL-NEG",
  "adidas-sambae::black": "ADI-SME-NEG",
  "adidas-sambae::blanca-y-verde": "ADI-SME-BVE",
  "adidas-samba-xlg::clasicas": "ADI-SXL-CLA",
  "adidas-samba-xlg::black": "ADI-SXL-NEG",
  "adidas-samba-xlg::off-white": "ADI-SXL-OFW",
  "adidas-campus::chocolate": "ADI-CMP-CHO",
  "adidas-campus::gris": "ADI-CMP-GRI",
  "adidas-gazelle::cherry": "ADI-GAZ-CHE",
  "adidas-gazelle::verde": "ADI-GAZ-DBL__verde",
  "adidas-gazelle::dark-blue": "ADI-GAZ-DBL__dark-blue",
  "adidas-gazelle::baby-blue": "ADI-GAZ-BBL",
  "adidas-sl-72::chocolate": "ADI-SL7-CHO",
  "adidas-spezial::off-white": "ADI-SPE-OFW",
  "adidas-spezial::verde": "ADI-SPE-VER",
  "adidas-busenitz::total-black": "ADI-BUS-TBL",
  "new-balance-574::gris": "NBA-574-GRI",
  "new-balance-574::beige": "NBA-574-BEI",
  "new-balance-327::beige": "NBA-327-BEI",
  "converse-all-star::nico": "CON-ALS-NEG",
  "zueco-kala::vison": "MGR-KAL-VIS",
  "zueco-kala::hielo": "MGR-KAL-HIE",
  "zueco-india::black": "MGR-IND-NEG",
  "zueco-india::suela": "MGR-IND-SUE",
  "zueco-birk::zueco-india-coco": "MGR-IND-COC",
  "zueco-birk::choco": "MGR-BRK-CHO",
  "zueco-bour::beige": "BOU-ZUE-VIS",
  "zueco-bour::black": "BOU-ZUE-NEG",
  "sandalia-birk::habano": "BOU-BRK-HAB",
  "sandalia-birk::black": "BOU-BRK-NEG",
};

export function driveImageKey(
  row: Pick<EcommerceRow, "marca" | "modelo" | "color">
): string {
  const target = catalogTargetFromSheet(row);
  if (target) {
    const mapped = DRIVE_FOLDER_BY_TARGET[`${target.slug}::${target.variantId}`];
    if (mapped) return mapped;
  }
  return slugify(`${row.marca}-${row.modelo}-${row.color}`);
}

const SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43"];

function resolveTarget(
  row: EcommerceRow
): { slug: string; variantId: string } | null {
  return catalogTargetFromSheet(row);
}

function parseCategoryTokens(raw: string): string[] {
  const out = new Set<string>();
  for (const part of raw.split(/[\/,|]+/)) {
    const t = part.trim().toLowerCase();
    if (!t) continue;
    if (t.includes("mega")) out.add("mega-sale");
    if (t.includes("talles bajos")) out.add("talles-bajos");
    if (t.includes("talles altos")) out.add("talles-altos");
    if (t.includes("summer") || t.includes("zueco") || t.includes("verano")) {
      out.add("summer");
    }
    if (t.includes("samba") && !t.includes("importad")) out.add("adidas/samba");
  }
  return [...out];
}

function brandCategories(brand: string, slug: string): string[] {
  const b = brand.toLowerCase().replace(/\s+/g, "-");
  if (!b || b === "rastro" || b === "gr" || b === "bourbon" || b === "pantuflas") {
    if (slug.startsWith("zueco") || slug.startsWith("sandalia")) return ["summer"];
    return [];
  }
  if (b.startsWith("new-balance") || b.includes("new")) return ["new-balance"];
  if (b.includes("nike")) return ["nike"];
  if (b.includes("adidas")) {
    const cats = ["adidas"];
    if (slug.includes("samba")) cats.push("adidas/samba");
    return cats;
  }
  if (b.includes("vans")) return ["vans"];
  if (b.includes("converse")) return ["converse"];
  return [b];
}

/** Celdas Excel corruptas (ej. "40/41 2" → 40412) se ignoran */
const MAX_SANE_STOCK = 200;

export function sanitizeStockQty(raw: unknown): number {
  const qty = Math.floor(Number(raw ?? 0));
  if (!Number.isFinite(qty) || qty < 0) return 0;
  if (qty > MAX_SANE_STOCK) return 0;
  return qty;
}

export function stockPairs(stock: Record<string, number>): number {
  return Object.values(stock).reduce((a, b) => a + sanitizeStockQty(b), 0);
}

function sizesFromStock(stock: Record<string, number>): ProductSize[] {
  return SIZES.map((label) => {
    const qty = sanitizeStockQty(stock[label]);
    return { label, stock: qty, inStock: qty > 0 };
  });
}

function applyRowToVariant(
  variant: ColorVariant,
  row: EcommerceRow
): ColorVariant {
  const price = formatMoney(row.precioWeb || 0);
  const transfer = formatMoney(row.precioEfTr || 0);
  const drive = DRIVE_IMAGES[driveImageKey(row)];
  const images = stripSizeChartImages(drive?.length ? drive : variant.images);
  const image = images[0] || (!drive?.length ? variant.image : "");
  return {
    ...variant,
    image,
    images,
    price,
    transfer,
    installments: String(INSTALLMENT_COUNT),
    installmentsLabel: installmentLabelFromPrice(price),
    sizes: sizesFromStock(row.stock),
  };
}

export type SyncEcommerceResult = {
  updatedProducts: ShopProduct[];
  matched: number;
  updatedSlugs: string[];
  unmatched: { modelo: string; color: string; reason: string }[];
};

/**
 * Aplica filas E-COMMERCE sobre el catálogo shop:
 * precios, transferencia, stock por talle, categorías,
 * y fotos Drive locales si existen en drive-images.json.
 */
export function syncEcommerceToProducts(
  ecommerce: EcommerceRow[],
  products: ShopProduct[]
): SyncEcommerceResult {
  const bySlug = new Map(products.map((p) => [p.slug, structuredClone(p)]));
  const unmatched: SyncEcommerceResult["unmatched"] = [];
  const touched = new Set<string>();
  let matched = 0;

  for (const row of ecommerce) {
    if (!row.marca?.trim() || !row.modelo?.trim() || !row.color?.trim()) continue;
    const target = resolveTarget(row);
    if (!target) {
      unmatched.push({
        modelo: `${row.marca} ${row.modelo}`.trim(),
        color: row.color,
        reason: "Sin mapeo al catálogo",
      });
      continue;
    }

    const product = bySlug.get(target.slug);
    if (!product) {
      unmatched.push({
        modelo: `${row.marca} ${row.modelo}`.trim(),
        color: row.color,
        reason: `Producto ${target.slug} no existe`,
      });
      continue;
    }

    const vIdx = product.variants.findIndex((v) => v.id === target.variantId);
    if (vIdx < 0) {
      unmatched.push({
        modelo: `${row.marca} ${row.modelo}`.trim(),
        color: row.color,
        reason: `Variante ${target.variantId} no existe en ${target.slug}`,
      });
      continue;
    }

    product.variants[vIdx] = applyRowToVariant(product.variants[vIdx], row);

    const extra = parseCategoryTokens(row.categorias);
    const brandCats = brandCategories(product.brand, product.slug);
    const cats = new Set([
      ...product.storeCategories,
      ...brandCats,
      ...extra,
    ]);
    product.storeCategories = [...cats];

    if (cats.has("mega-sale")) {
      if (!product.tags.includes("Mega Sale")) {
        product.tags = [...product.tags, "Mega Sale"];
      }
    }

    if (row.descripcion?.trim() && row.descripcion.length > 20) {
      product.description = row.descripcion.trim();
    }

    const totalStock = product.variants.reduce(
      (s, v) =>
        s + v.sizes.reduce((a, sz) => a + (typeof sz.stock === "number" ? sz.stock : 0), 0),
      0
    );
    product.active = totalStock > 0 || row.estado.toLowerCase().includes("cargar");

    bySlug.set(target.slug, product);
    touched.add(target.slug);
    matched += 1;
  }

  const now = new Date().toISOString();
  const updatedProducts = products.map((p) => {
    if (!touched.has(p.slug)) return p;
    const next = bySlug.get(p.slug)!;
    return normalizeProductStock({
      ...next,
      updatedAt: now,
    });
  });

  return {
    updatedProducts,
    matched,
    updatedSlugs: [...touched],
    unmatched,
  };
}
