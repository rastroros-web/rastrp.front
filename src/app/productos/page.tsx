import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopChrome } from "@/components/ShopChrome";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";

export const metadata: Metadata = {
  title: "Catálogo | RASTRO",
  description: "Zapatillas y sandalias Nike, Adidas y más. Mega Sale con envíos a todo el país.",
};

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
