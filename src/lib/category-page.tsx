import type { Metadata } from "next";
import { ShopChrome } from "@/components/ShopChrome";
import { CategoryPage } from "@/components/catalog/CategoryPage";
import { pageMetadata } from "@/lib/seo";

export function categoryMetadata(title: string, path: string): Metadata {
  return pageMetadata({
    title,
    description: `Comprá ${title} en Rastro. Zapatillas originales, 25% OFF por transferencia, 3 cuotas sin interés y envíos a todo el país.`,
    path,
  });
}

export function CategoryRoute({ slug, title }: { slug: string; title: string }) {
  return (
    <ShopChrome>
      <main className="flex-1">
        <CategoryPage slug={slug} title={title} />
      </main>
    </ShopChrome>
  );
}
