"use client";

import Link from "next/link";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";

export function CategoryPage({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-12">
      <nav className="mb-4 text-[10px] font-semibold tracking-[0.1em] text-soft uppercase md:mb-6 md:text-[11px] md:tracking-[0.12em]">
        <Link href="/" className="transition hover:text-[#222222]">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#222222]">{title}</span>
      </nav>

      <CatalogGrid title={title} categorySlug={slug} />
    </div>
  );
}
