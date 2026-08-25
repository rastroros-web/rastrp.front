import type { Metadata } from "next";
import { ShopChrome } from "@/components/ShopChrome";
import { CategoryPage } from "@/components/catalog/CategoryPage";

export function categoryMetadata(title: string): Metadata {
  return {
    title: `${title} | RASTRO`,
    description: `Comprá ${title} en Rastro. 25% OFF por transferencia y envíos a todo el país.`,
  };
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
