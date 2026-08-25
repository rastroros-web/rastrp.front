"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/store/StoreProvider";
import { filterByCategory, storeCategoryRoutes } from "@/data/catalog";

export function CategoryPage({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { products, ready } = useStore();
  const source = ready ? products.filter((p) => p.active !== false) : [];
  const items = filterByCategory(slug, source);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-12">
      <nav className="mb-4 text-[10px] font-semibold tracking-[0.1em] text-soft uppercase md:mb-6 md:text-[11px] md:tracking-[0.12em]">
        <Link href="/" className="transition hover:text-[#222222]">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#222222]">{title}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 border-b border-black/5 pb-6 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Shop
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-soft">
            {items.length} producto{items.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {storeCategoryRoutes.map((c) => (
            <Link
              key={c.slug}
              href={c.href}
              className={`shrink-0 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase transition ${
                c.slug === slug ||
                (slug === "productos" && c.slug === "productos")
                  ? "bg-[#222222] text-white"
                  : "bg-[#f5f4f0] text-[#222222] hover:bg-black/10"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {!ready ? (
        <p className="mt-16 text-center text-sm text-soft">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-soft">
          No hay productos en esta categoría por ahora.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3 sm:gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:grid-cols-4">
          {items.map((product, index) => (
            <ProductCard
              key={`${product.slug}-${product.variantId}`}
              product={product}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
