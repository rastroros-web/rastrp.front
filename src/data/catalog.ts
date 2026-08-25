import catalogData from "@/data/catalog.generated.json";
import aliasData from "@/data/catalog.aliases.json";
import cloudinaryDrive from "@/data/cloudinary-drive.json";
import {
  formatMoney,
  installmentFromPrice,
  parseMoney,
  transferFromPrice,
} from "@/lib/mock/money";

export type ProductSize = {
  label: string;
  inStock: boolean;
  /** Unidades disponibles (mock). Si falta, se infiere de inStock. */
  stock?: number;
};

export type ColorVariant = {
  id: string;
  name: string;
  color: string;
  image: string;
  images: string[];
  price: string;
  transfer: string;
  installments: string | null;
  installmentsLabel?: string | null;
  sizes: ProductSize[];
  legacySlug?: string;
  /** % de oferta mock (si está en promo) */
  salePercent?: number;
  /** Precio tachado / antes de oferta */
  compareAtPrice?: string;
};

export type CatalogProduct = {
  id?: number;
  slug: string;
  name: string;
  modelo?: string;
  brand: string;
  category: "zapatillas" | "sandalias" | "sale";
  storeCategories: string[];
  primaryCategory: string;
  description: string;
  tags: string[];
  megaSale?: boolean;
  megaSalePercent?: number | null;
  megaSaleStartsAt?: string | null;
  megaSaleEndsAt?: string | null;
  sourceUrl?: string;
  variants: ColorVariant[];
};

type Alias = { slug: string; color: string };

/** Primera foto de zapatillas (Drive o Cloudinary): la tabla de medidas. */
export function isDriveSizeChartSrc(src: string): boolean {
  const path = String(src || "").split("?")[0];
  if (
    /\/assets\/products\/drive\/(?:ADI|VAN|NIK|NBA|CON)-[^/]+\/01\.webp$/i.test(
      path
    )
  ) {
    return true;
  }
  return /\/rastro\/products\/(?:adidas|nike|vans|new-balance|converse)[^/]*\/[^/]+\/01(?:\.(?:webp|jpe?g|png))?$/i.test(
    path
  );
}

export function stripSizeChartImages(images: string[]): string[] {
  return images.filter((src) => Boolean(src) && !isDriveSizeChartSrc(src));
}

function stripProductSizeCharts(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    variants: product.variants.map((variant) => {
      const images = stripSizeChartImages(variant.images || []);
      const image =
        variant.image && !isDriveSizeChartSrc(variant.image)
          ? variant.image
          : images[0] || "";
      return { ...variant, images, image };
    }),
  };
}

export const catalog = (catalogData as CatalogProduct[]).map(
  stripProductSizeCharts
);
export const catalogAliases = aliasData as Record<string, Alias>;
const CLOUDINARY_DRIVE = cloudinaryDrive as Record<string, string[]>;

function isCloudinarySrc(src: string): boolean {
  return /res(?:-\d+)?\.cloudinary\.com/i.test(src);
}

function cloudinaryDriveImages(slug: string, variantId: string): string[] {
  return stripSizeChartImages(
    (CLOUDINARY_DRIVE[`${slug}/${variantId}`] || []).filter(Boolean)
  );
}

/** Flat list for grids: one card per product (variants as swatches). */
export type ProductCardModel = {
  slug: string;
  variantId: string;
  name: string;
  brand: string;
  price: string;
  local: string;
  transfer: string;
  installments: string | null;
  href: string;
  colors: { id: string; color: string; name: string }[];
  storeCategories: string[];
  tags: string[];
  megaSale?: boolean;
  megaSalePercent?: number | null;
  compareAtPrice?: string;
  megaSaleUntil?: string | null;
  liquidacion?: boolean;
};

export function isMegaSale(
  p: {
    megaSale?: boolean;
    megaSalePercent?: number | null;
    megaSaleStartsAt?: string | null;
    megaSaleEndsAt?: string | null;
    tags?: string[];
    storeCategories?: string[];
  },
  now = Date.now()
): boolean {
  if (p.megaSale) {
    const percent = Number(p.megaSalePercent) || 0;
    if (percent <= 0) return false;
    if (p.megaSaleStartsAt && new Date(p.megaSaleStartsAt).getTime() > now) {
      return false;
    }
    if (p.megaSaleEndsAt && new Date(p.megaSaleEndsAt).getTime() < now) {
      return false;
    }
    return true;
  }
  return Boolean(
    p.tags?.includes("Mega Sale") ||
      p.storeCategories?.some((c) => c.includes("mega-sale"))
  );
}

export function megaSalePercentOf(p: {
  megaSale?: boolean;
  megaSalePercent?: number | null;
  megaSaleStartsAt?: string | null;
  megaSaleEndsAt?: string | null;
  tags?: string[];
  storeCategories?: string[];
}): number {
  if (!isMegaSale(p)) return 0;
  return Math.max(0, Math.floor(Number(p.megaSalePercent) || 0));
}

export function megaSaleUntilLabel(endsAt?: string | null): string | null {
  if (!endsAt) return null;
  const d = new Date(endsAt);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(d);
}

export function isLiquidacion(p: {
  tags?: string[];
  storeCategories?: string[];
}): boolean {
  const tags = p.tags ?? [];
  const cats = p.storeCategories ?? [];
  return (
    tags.some((t) => /liquidaci[oó]n/i.test(t)) ||
    cats.some((c) => /liquidaci[oó]n|liquidation/i.test(c))
  );
}

function cardName(productName: string, variantName?: string): string {
  const color = variantName?.trim();
  if (!color) return productName;
  if (productName.toLowerCase().includes(color.toLowerCase())) return productName;
  return `${productName} ${color}`;
}

export function pricedForMegaSale(
  listPrice: string,
  transferPrice: string,
  product: {
    megaSale?: boolean;
    megaSalePercent?: number | null;
    megaSaleStartsAt?: string | null;
    megaSaleEndsAt?: string | null;
    tags?: string[];
    storeCategories?: string[];
  }
) {
  const percent = megaSalePercentOf(product);
  const original = parseMoney(listPrice);
  const transfer = transferFromPrice(listPrice);
  if (!percent || original <= 0) {
    return {
      active: false,
      percent: 0,
      original: listPrice,
      price: listPrice,
      transfer,
      installments: installmentFromPrice(listPrice),
      until: null as string | null,
    };
  }
  const price = formatMoney(original * (1 - percent / 100));
  return {
    active: true,
    percent,
    original: formatMoney(original),
    price,
    transfer,
    installments: installmentFromPrice(price),
    until: megaSaleUntilLabel(product.megaSaleEndsAt),
  };
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  const direct = catalog.find((p) => p.slug === slug);
  if (direct) return direct;

  const alias = catalogAliases[slug];
  if (alias) return catalog.find((p) => p.slug === alias.slug);

  return catalog.find((p) => p.variants.some((v) => v.id === slug || v.legacySlug === slug));
}

export function resolveInitialVariantId(
  product: CatalogProduct,
  slugParam: string,
  colorParam?: string | null
): string {
  if (colorParam && product.variants.some((v) => v.id === colorParam)) {
    return colorParam;
  }

  const alias = catalogAliases[slugParam];
  if (alias?.slug === product.slug && product.variants.some((v) => v.id === alias.color)) {
    return alias.color;
  }

  const byLegacy = product.variants.find(
    (v) => v.legacySlug === slugParam || v.id === slugParam
  );
  if (byLegacy) return byLegacy.id;

  return product.variants[0]?.id;
}

export function getVariant(
  product: CatalogProduct,
  variantId?: string | null
): ColorVariant {
  return (
    product.variants.find((v) => v.id === variantId) ?? product.variants[0]
  );
}

export function variantCover(variant?: ColorVariant | null): string {
  if (!variant) return "/assets/products/product-1.webp";
  const fromList = stripSizeChartImages(
    (variant.images || []).map((src) => src?.trim()).filter(Boolean)
  )[0];
  const cover = fromList || (!isDriveSizeChartSrc(variant.image || "")
    ? variant.image?.trim()
    : "");
  return cover || "/assets/products/product-1.webp";
}

export function fillEmptyVariantImages<T extends { slug: string; variants: ColorVariant[] }>(
  product: T
): T {
  const fromCatalog = catalog.find((item) => item.slug === product.slug);
  return {
    ...product,
    variants: product.variants.map((variant) => {
      const images = stripSizeChartImages(
        (variant.images || []).map((src) => src?.trim()).filter(Boolean)
      );
      const rawImage = variant.image?.trim() || "";
      const image = isDriveSizeChartSrc(rawImage) ? "" : rawImage;
      const current = images.length ? images : image ? [image] : [];
      const fromCloudinary = current.filter(isCloudinarySrc);
      if (fromCloudinary.length) {
        return {
          ...variant,
          images: fromCloudinary,
          image: fromCloudinary[0],
        };
      }
      const mapped = cloudinaryDriveImages(product.slug, variant.id);
      if (mapped.length) {
        return { ...variant, images: mapped, image: mapped[0] };
      }
      if (current.length) {
        return { ...variant, images: current, image: current[0] };
      }
      const fallback =
        fromCatalog?.variants.find((item) => item.id === variant.id) ||
        fromCatalog?.variants[0];
      if (!fallback) {
        return {
          ...variant,
          image: "/assets/products/product-1.webp",
          images: ["/assets/products/product-1.webp"],
        };
      }
      const restored = stripSizeChartImages(
        (fallback.images?.length ? fallback.images : [fallback.image]).filter(
          Boolean
        )
      );
      return {
        ...variant,
        image: restored[0] || "/assets/products/product-1.webp",
        images: restored.length
          ? restored
          : ["/assets/products/product-1.webp"],
      };
    }),
  };
}

export function toProductCard(
  product: CatalogProduct,
  variant = product.variants[0]
): ProductCardModel {
  const chosen = variant ?? product.variants[0];
  const priced = pricedForMegaSale(chosen.price, chosen.transfer, product);
  return {
    slug: product.slug,
    variantId: chosen.id,
    name: cardName(product.name, chosen.name),
    brand: product.brand,
    price: priced.price,
    local: variantCover(chosen),
    transfer: priced.transfer,
    installments: priced.installments,
    href: `/productos/${product.slug}?color=${encodeURIComponent(chosen.id)}`,
    colors: product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      name: v.name,
    })),
    storeCategories: product.storeCategories,
    tags: product.tags,
    megaSale: priced.active,
    megaSalePercent: priced.percent || null,
    compareAtPrice: priced.active ? priced.original : undefined,
    megaSaleUntil: priced.until,
    liquidacion: isLiquidacion(product),
  };
}

export function uniqueCardsBySlug(
  cards: ProductCardModel[]
): ProductCardModel[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.slug)) return false;
    seen.add(card.slug);
    return true;
  });
}

export function flattenCatalog(
  source: CatalogProduct[] = catalog
): ProductCardModel[] {
  return source.flatMap((product) => {
    const variants = product.variants?.filter(Boolean) ?? [];
    if (!variants.length) return [];
    return variants.map((variant) => toProductCard(product, variant));
  });
}

/** Busca por marca, modelo, color o tags. Varias palabras: todas tienen que aparecer. */
export function productMatchesQuery(
  product: ProductCardModel,
  query: string
): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  const haystack = [
    product.name,
    product.brand,
    ...(product.tags || []),
    ...(product.colors || []).map((c) => c.color),
    ...(product.colors || []).map((c) => c.name),
  ]
    .join(" ")
    .toLowerCase();
  return raw.split(/\s+/).every((part) => haystack.includes(part));
}

export function filterByCategory(
  categorySlug: string,
  source: CatalogProduct[] = catalog
): ProductCardModel[] {
  const key = categorySlug.toLowerCase();

  // Colecciones curadas (mismas que Tienda Nube)
  const TALLES_BAJOS = new Set([
    "adidas-spezial",
    "adidas-gazelle",
    "adidas-samba",
    "vans-vr3",
  ]);
  const TALLES_ALTOS = new Set([
    "adidas-busenitz",
    "adidas-campus",
    "nike-jordan-1-low-azul",
  ]);

  if (key === "talles-bajos") {
    return flattenCatalog(
      source.filter(
        (p) =>
          TALLES_BAJOS.has(p.slug) ||
          p.storeCategories.some((c) => c.includes("talles-bajos"))
      )
    );
  }

  if (key === "talles-altos") {
    return flattenCatalog(
      source.filter(
        (p) =>
          TALLES_ALTOS.has(p.slug) ||
          p.storeCategories.some((c) => c.includes("talles-altos"))
      )
    );
  }

  if (key === "samba") {
    return flattenCatalog(source).filter(
      (p) =>
        /samba/i.test(p.name) ||
        p.storeCategories.some((c) => c.includes("samba"))
    );
  }

  if (key === "mega-sale" || key === "sale") {
    return flattenCatalog(source.filter(isMegaSale));
  }

  if (key === "liquidacion" || key === "liquidación") {
    return flattenCatalog(source.filter(isLiquidacion));
  }

  return flattenCatalog(source).filter((p) => {
    if (key === "productos" || key === "all") return true;
    if (key === "summer") {
      return (
        p.tags.includes("Summer") ||
        p.storeCategories.some((c) => c.includes("summer")) ||
        /sandalia|ojota|zueco/i.test(p.name)
      );
    }
    return (
      p.brand.toLowerCase().replace(/\s+/g, "-") === key ||
      p.storeCategories.some(
        (c) => c === key || c.startsWith(`${key}/`) || c.split("/")[0] === key
      )
    );
  });
}

export const brands = [...new Set(catalog.map((p) => p.brand))].sort();

export const storeCategoryRoutes = [
  { slug: "productos", label: "Catálogo", href: "/productos" },
  { slug: "mega-sale", label: "Mega Sale", href: "/mega-sale" },
  { slug: "liquidacion", label: "Liquidación", href: "/liquidacion" },
  { slug: "nike", label: "Nike", href: "/nike" },
  { slug: "adidas", label: "Adidas", href: "/adidas" },
  { slug: "samba", label: "Samba", href: "/samba" },
  { slug: "talles-bajos", label: "Talles bajos", href: "/talles-bajos" },
  { slug: "talles-altos", label: "Talles altos", href: "/talles-altos" },
  { slug: "vans", label: "Vans", href: "/vans" },
  { slug: "summer", label: "Summer", href: "/summer" },
] as const;

export const categories = [
  { id: "all", label: "Todo" },
  { id: "zapatillas", label: "Zapatillas" },
  { id: "sandalias", label: "Sandalias" },
  { id: "sale", label: "Sale" },
  { id: "liquidacion", label: "Liquidación" },
] as const;
