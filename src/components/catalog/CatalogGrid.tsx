"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { FancySelect } from "@/components/ui/FancySelect";
import { useStore } from "@/components/store/StoreProvider";
import {
  brands,
  categories,
  flattenCatalog,
  isMegaSale,
  storeCategoryRoutes,
  isLiquidacion,
  productMatchesQuery,
  type ProductCardModel,
} from "@/data/catalog";
import { parseMoney } from "@/lib/mock/money";
import { sizeQty } from "@/lib/mock/stock";

type SortKey = "featured" | "price-asc" | "price-desc" | "name" | "newest";

const PAGE_SIZE = 12;
const SORT_KEYS: SortKey[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "name",
];

const SIZE_OPTIONS = [
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Destacados" },
  { value: "newest", label: "Más nuevos" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name", label: "Nombre A–Z" },
];

function isSortKey(value: string): value is SortKey {
  return SORT_KEYS.includes(value as SortKey);
}

export function CatalogGrid() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { products, ready, getProduct } = useStore();

  const qUrl = searchParams.get("q") ?? "";
  const [qDraft, setQDraft] = useState(qUrl);

  const liveBrands = useMemo(() => {
    const list = ready ? products : [];
    return [...new Set(list.map((p) => p.brand))].sort();
  }, [products, ready]);

  const brand = useMemo(() => {
    const raw = searchParams.get("marca") ?? "all";
    if (raw === "all") return "all";
    const known = liveBrands.length ? liveBrands : brands;
    return (
      known.find((b) => b.toLowerCase() === raw.toLowerCase()) ?? "all"
    );
  }, [searchParams, liveBrands]);

  const category = useMemo(() => {
    const raw = searchParams.get("categoria") ?? "all";
    return categories.some((c) => c.id === raw) ? raw : "all";
  }, [searchParams]);

  const size = useMemo(() => {
    const raw = searchParams.get("talle") ?? "all";
    return raw === "all" || SIZE_OPTIONS.includes(raw) ? raw : "all";
  }, [searchParams]);

  const sort = useMemo<SortKey>(() => {
    const raw = searchParams.get("orden") ?? "featured";
    return isSortKey(raw) ? raw : "featured";
  }, [searchParams]);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        const omit =
          !value ||
          value === "all" ||
          (key === "orden" && value === "featured") ||
          (key === "page" && value === "1");
        if (omit) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setQDraft(qUrl);
  }, [qUrl]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (qDraft.trim() === qUrl.trim()) return;
      patchQuery({ q: qDraft.trim() || null, page: null });
    }, 280);
    return () => window.clearTimeout(handle);
  }, [qDraft, qUrl, patchQuery]);

  const q = qDraft;

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.label })),
    []
  );

  const brandOptions = useMemo(
    () => [
      { value: "all", label: "Todas" },
      ...(liveBrands.length ? liveBrands : brands).map((b) => ({
        value: b,
        label: b,
      })),
    ],
    [liveBrands]
  );

  const sizeOptions = useMemo(
    () => [
      { value: "all", label: "Todos" },
      ...SIZE_OPTIONS.map((s) => ({ value: s, label: s })),
    ],
    []
  );

  const items = useMemo(() => {
    const source = ready ? products.filter((p) => p.active !== false) : [];
    const list = flattenCatalog(source).filter((p) => {
      if (brand !== "all" && p.brand !== brand) return false;
      if (q.trim() && !productMatchesQuery(p, q)) return false;
      if (size !== "all") {
        const live = getProduct(p.slug);
        const variant = live?.variants.find((v) => v.id === p.variantId);
        const hasSize = variant?.sizes.some(
          (s) => s.label === size && sizeQty(s) > 0
        );
        if (!hasSize) return false;
      }
      if (category === "all") return true;
      if (category === "sale") {
        return isMegaSale(p);
      }
      if (category === "liquidacion") {
        return isLiquidacion(p);
      }
      if (category === "sandalias") {
        return /sandalia|ojota|zueco/i.test(p.name);
      }
      if (category === "zapatillas") {
        return !/sandalia|ojota|zueco/i.test(p.name);
      }
      return true;
    });

    const sorted = [...list];
    if (sort === "price-asc") {
      sorted.sort((a, b) => parseMoney(a.price) - parseMoney(b.price));
    } else if (sort === "price-desc") {
      sorted.sort((a, b) => parseMoney(b.price) - parseMoney(a.price));
    } else if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
    } else if (sort === "newest") {
      sorted.reverse();
    }
    return sorted as ProductCardModel[];
  }, [brand, category, products, ready, q, sort, size, getProduct]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) patchQuery({ page: String(totalPages) });
  }, [page, totalPages, patchQuery]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  const from = items.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, items.length);

  const goToPage = (next: number) => {
    patchQuery({ page: String(next) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="relative z-20 flex flex-col gap-4 border-b border-black/5 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Shop
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-6xl">
            Catálogo
          </h1>
          <p className="mt-2 text-sm text-soft">
            {items.length} producto{items.length === 1 ? "" : "s"}
            {q.trim() ? ` para “${q.trim()}”` : ""}
            {size !== "all" ? ` · talle ${size}` : ""}
            {items.length > 0 ? ` · mostrando ${from}–${to}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <label className="col-span-2 flex min-w-0 flex-col gap-1 text-[10px] font-semibold tracking-[0.16em] uppercase text-soft sm:col-span-1">
            Buscar
            <input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                patchQuery({ q: qDraft.trim() || null, page: null });
              }}
              placeholder="Marca, modelo o color…"
              className="w-full border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold tracking-[0.04em] text-[#222222] normal-case outline-none transition hover:border-[#222222] focus:border-[#222222]"
            />
          </label>
          <FancySelect
            label="Categoría"
            value={category}
            options={categoryOptions}
            onChange={(value) => patchQuery({ categoria: value, page: null })}
          />
          <FancySelect
            label="Marca"
            value={brand}
            options={brandOptions}
            onChange={(value) => patchQuery({ marca: value, page: null })}
          />
          <FancySelect
            label="Talle"
            value={size}
            options={sizeOptions}
            onChange={(value) => patchQuery({ talle: value, page: null })}
          />
          <FancySelect
            className="col-span-2 sm:col-span-1"
            label="Ordenar"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) =>
              patchQuery({ orden: value, page: null })
            }
          />
        </div>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {storeCategoryRoutes.map((c) => (
          <Link
            key={c.slug}
            href={c.href}
            className="shrink-0 bg-[#f5f4f0] px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase transition hover:bg-black/10"
          >
            {c.label}
          </Link>
        ))}
      </div>

      {!ready ? (
        <p className="mt-16 text-center text-sm text-soft">Cargando catálogo…</p>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-soft">
          No hay productos con estos filtros.
        </p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3 sm:gap-y-8 md:mt-10 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:grid-cols-4">
            {pageItems.map((product, index) => (
              <ProductCard
                key={`${product.slug}-${product.variantId}`}
                product={product}
                index={index}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-10 flex flex-col items-center gap-4 border-t border-black/5 pt-8 sm:flex-row sm:justify-between"
              aria-label="Paginación"
            >
              <p className="text-xs text-soft">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => goToPage(safePage - 1)}
                  className="btn-press border border-[#222222] px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={n === safePage ? "page" : undefined}
                      className={`btn-press min-w-9 px-2.5 py-2 text-[11px] font-semibold ${
                        n === safePage
                          ? "bg-[#222222] text-white"
                          : "border border-black/15 hover:border-[#222222]"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  className="btn-press border border-[#222222] px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Siguiente
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
