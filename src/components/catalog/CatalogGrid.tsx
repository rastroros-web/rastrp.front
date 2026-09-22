"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { FancySelect } from "@/components/ui/FancySelect";
import { useStore } from "@/components/store/StoreProvider";
import {
  brands,
  categories,
  flattenCatalog,
  isMegaSale,
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
      patchQuery({
        q: qDraft.trim() || null,
        page: null,
        marca: null,
      });
    }, 280);
    return () => window.clearTimeout(handle);
  }, [qDraft, qUrl, patchQuery]);

  const q = qDraft;

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.label })),
    []
  );

  const sizeOptions = useMemo(
    () => [
      { value: "all", label: "Todos" },
      ...SIZE_OPTIONS.map((s) => ({ value: s, label: s })),
    ],
    []
  );

  const matchesBase = useCallback(
    (p: ProductCardModel) => {
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
      if (category === "sale") return isMegaSale(p);
      if (category === "sandalias") {
        return /sandalia|ojota|zueco/i.test(p.name);
      }
      if (category === "zapatillas") {
        return !/sandalia|ojota|zueco/i.test(p.name);
      }
      return true;
    },
    [q, size, category, getProduct]
  );

  const searched = useMemo(() => {
    const source = ready ? products.filter((p) => p.active !== false) : [];
    return flattenCatalog(source).filter(matchesBase);
  }, [products, ready, matchesBase]);

  const availableBrands = useMemo(() => {
    const fromSearch = [
      ...new Set(searched.map((p) => p.brand).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "es"));
    if (q.trim()) return fromSearch;
    return liveBrands.length ? liveBrands : brands;
  }, [searched, liveBrands, q]);

  const brandOptions = useMemo(
    () => [
      { value: "all", label: "Todas" },
      ...availableBrands.map((b) => ({ value: b, label: b })),
    ],
    [availableBrands]
  );

  useEffect(() => {
    if (brand === "all") return;
    if (availableBrands.some((b) => b === brand)) return;
    patchQuery({ marca: null, page: null });
  }, [brand, availableBrands, patchQuery]);

  const items = useMemo(() => {
    const list =
      brand === "all"
        ? searched
        : searched.filter((p) => p.brand === brand);

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
  }, [searched, brand, sort]);

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
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <div>
      <div className="relative z-20 flex flex-col gap-4 border-b border-black/5 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Shop
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-6xl">
            {q.trim() ? q.trim() : "Catálogo"}
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
                patchQuery({
                  q: qDraft.trim() || null,
                  page: null,
                  marca: null,
                });
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

      {!ready ? (
        <p className="mt-16 text-center text-sm text-soft">Cargando catálogo…</p>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-soft">
            No hay productos con estos filtros
            {q.trim() ? ` para “${q.trim()}”` : ""}.
          </p>
          <button
            type="button"
            onClick={() =>
              patchQuery({
                q: q.trim() || null,
                marca: null,
                categoria: null,
                talle: null,
                page: null,
              })
            }
            className="btn-press mt-4 border border-[#222222] px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            Ver todos los resultados
          </button>
        </div>
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
