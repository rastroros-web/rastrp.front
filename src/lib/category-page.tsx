import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopChrome } from "@/components/ShopChrome";
import { CategoryPage } from "@/components/catalog/CategoryPage";
import { pageMetadata } from "@/lib/seo";

export function categoryMetadata(title: string, path: string): Metadata {
  return pageMetadata({
    title,
    description: `Comprá ${title} en Rastro. Calzado en tendencia, 25% OFF por transferencia, 3 cuotas sin interés y envíos a todo el país.`,
    path,
  });
}

export function CategoryRoute({ slug, title }: { slug: string; title: string }) {
  return (
    <ShopChrome>
      <main className="flex-1">
        <Suspense
          fallback={
            <p className="px-4 py-16 text-center text-sm text-soft">
              Cargando catálogo…
            </p>
          }
        >
          <CategoryPage slug={slug} title={title} />
        </Suspense>
      </main>
    </ShopChrome>
  );
}
