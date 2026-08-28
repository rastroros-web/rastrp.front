import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopChrome } from "@/components/ShopChrome";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Catálogo",
  description:
    "Catálogo de zapatillas y sandalias Nike, Adidas, Vans, New Balance y más. 25% OFF por transferencia y envíos a todo el país.",
  path: "/productos",
});

export default function ProductosPage() {
  return (
    <ShopChrome>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <Suspense fallback={<p className="text-sm text-soft">Cargando catálogo…</p>}>
            <CatalogGrid />
          </Suspense>
        </div>
      </main>
    </ShopChrome>
  );
}
