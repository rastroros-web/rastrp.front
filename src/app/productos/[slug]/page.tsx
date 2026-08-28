import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopChrome } from "@/components/ShopChrome";
import { ProductDetail } from "@/components/catalog/ProductDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  catalog,
  catalogAliases,
  getProductBySlug,
  getVariant,
  resolveInitialVariantId,
} from "@/data/catalog";
import { fetchShopProducts, findShopProduct } from "@/lib/api/backend";
import { parseMoney } from "@/lib/mock/money";
import { pageMetadata, productJsonLd } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ color?: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  const parents = catalog.map((p) => ({ slug: p.slug }));
  const legacy = Object.keys(catalogAliases).map((slug) => ({ slug }));
  return [...parents, ...legacy];
}

async function resolveProduct(slug: string) {
  const fromApi = await fetchShopProducts();
  if (fromApi?.length) return findShopProduct(fromApi, slug);
  return getProductBySlug(slug);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { color } = await searchParams;
  const product = await resolveProduct(slug);
  if (!product) return { title: "Producto" };
  const variantId = resolveInitialVariantId(product, slug, color);
  const variant = getVariant(product, variantId);
  const title = `${product.name} ${variant.name}`;
  return pageMetadata({
    title,
    description: product.description,
    path: `/productos/${product.slug}`,
    image: variant.image || product.variants[0]?.image,
    imageAlt: title,
    keywords: [product.brand, product.name, "zapatillas", "Rastro", ...product.tags],
  });
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { color } = await searchParams;
  const product = await resolveProduct(slug);
  if (!product) notFound();

  const initialColor = resolveInitialVariantId(product, slug, color);
  const variant = getVariant(product, initialColor);
  const inStock = variant.sizes.some((size) => size.inStock);
  const structuredData = productJsonLd({
    name: `${product.name} ${variant.name}`,
    description: product.description,
    slug: product.slug,
    brand: product.brand,
    image: variant.image,
    price: parseMoney(variant.price),
    inStock,
  });

  return (
    <ShopChrome>
      <JsonLd data={structuredData} />
      <main className="flex-1">
        <ProductDetail
          key={product.slug}
          product={product}
          initialColor={initialColor}
        />
      </main>
    </ShopChrome>
  );
}
