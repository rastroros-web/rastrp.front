"use client";

import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/store/StoreProvider";
import { flattenCatalog } from "@/data/catalog";

export default function FavoritosPage() {
  const { wishlist, products, ready } = useStore();
  const source = ready ? products.filter((p) => p.active !== false) : [];
  const items = flattenCatalog(source).filter((p) => wishlist.includes(p.slug));

  return (
    <ShopChrome>
      <main className="mx-auto max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-12">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Wishlist
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
          Favoritos
        </h1>
        <p className="mt-2 text-sm text-soft">
          {items.length === 0
            ? "Todavía no guardaste nada"
            : `${items.length} producto${items.length === 1 ? "" : "s"}`}
        </p>

        {items.length === 0 ? (
          <div className="mt-10">
            <p className="max-w-md text-sm text-soft">
              Tocá el corazón en cualquier producto para guardarlo acá y
              encontrarlo rápido después.
            </p>
            <Link
              href="/productos"
              className="btn-press mt-6 inline-flex bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-2.5 gap-y-7 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard
                key={`${product.slug}-${product.variantId}`}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </main>
    </ShopChrome>
  );
}
