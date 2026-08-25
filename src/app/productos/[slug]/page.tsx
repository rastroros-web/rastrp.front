import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopChrome } from "@/components/ShopChrome";
import { ProductDetail } from "@/components/catalog/ProductDetail";
import {
  catalog,
  catalogAliases,
  getProductBySlug,
  getVariant,
  resolveInitialVariantId,
} from "@/data/catalog";
import { fetchShopProducts, findShopProduct } from "@/lib/api/backend";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ color?: string }>;
};

export const dynamic = "force-dynamic";

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
  if (!product) return { title: "Producto | RASTRO" };
  const variantId = resolveInitialVariantId(product, slug, color);
  const variant = getVariant(product, variantId);
  return {
    title: `${product.name} ${variant.name} | RASTRO`,
    description: product.description,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { color } = await searchParams;
  const product = await resolveProduct(slug);
  if (!product) notFound();

  const initialColor = resolveInitialVariantId(product, slug, color);

  return (
    <ShopChrome>
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
