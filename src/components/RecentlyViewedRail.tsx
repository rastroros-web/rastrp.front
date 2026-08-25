"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/store/StoreProvider";
import { flattenCatalog, uniqueCardsBySlug } from "@/data/catalog";

export function RecentlyViewedRail() {
  const { recentlyViewed, products, ready } = useStore();
  if (!ready || recentlyViewed.length === 0) return null;

  const items = uniqueCardsBySlug(
    flattenCatalog(products.filter((p) => p.active !== false)).filter((p) =>
      recentlyViewed.includes(p.slug)
    )
  ).slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-7 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Seguí mirando
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
            Vistos recientemente
          </h2>
        </div>
        <Link
          href="/productos"
          className="text-[11px] font-semibold tracking-[0.16em] uppercase underline-offset-4 hover:underline"
        >
          Ver catálogo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
        {items.map((product, index) => (
          <ProductCard
            key={`rv-${product.slug}-${product.variantId}`}
            product={product}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
