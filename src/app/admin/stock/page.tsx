"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import {
  getLowStockItems,
  LOW_STOCK_THRESHOLD,
  stockLevelClasses,
  stockLevelTone,
} from "@/lib/mock/lowStock";
import { sizeQty } from "@/lib/mock/stock";
import type { ShopProduct } from "@/lib/mock/types";
import { FancySelect } from "@/components/ui/FancySelect";

type ToneFilter = "all" | "out" | "low";

type ProductAlert = {
  slug: string;
  name: string;
  brand: string;
  image: string;
  out: number;
  low: number;
  total: number;
};

function productImage(p: ShopProduct) {
  return p.variants[0]?.image || "/assets/products/product-1.webp";
}

export default function AdminStockPage() {
  const { products, getProduct, saveProduct } = useStore();
  const items = useMemo(() => getLowStockItems(products), [products]);
  const [q, setQ] = useState("");
  const [tone, setTone] = useState<ToneFilter>("all");
  const [brand, setBrand] = useState("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShopProduct | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (!selectedSlug) {
      setDraft(null);
      setDirty(false);
      return;
    }
    const live = getProduct(selectedSlug);
    if (!live) {
      setDraft(null);
      setDirty(false);
      return;
    }
    if (!dirty) {
      setDraft(structuredClone(live));
    }
  }, [selectedSlug, products, getProduct, dirty]);

  const updateSizeQty = (
    variantId: string,
    sizeLabel: string,
    nextQty: number
  ) => {
    const qty = Math.max(0, Math.min(999, Math.floor(Number(nextQty) || 0)));
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map((v) => {
          if (v.id !== variantId) return v;
          const sizes = [...v.sizes];
          const idx = sizes.findIndex((s) => s.label === sizeLabel);
          if (idx >= 0) {
            sizes[idx] = { ...sizes[idx], stock: qty, inStock: qty > 0 };
          } else {
            sizes.push({ label: sizeLabel, stock: qty, inStock: qty > 0 });
          }
          return { ...v, sizes };
        }),
      };
    });
    setDirty(true);
    setSavedMsg(false);
  };

  const saveChanges = () => {
    if (!draft || !dirty) return;
    saveProduct(draft);
    setDirty(false);
    setSavedMsg(true);
    window.setTimeout(() => setSavedMsg(false), 2200);
  };

  const discardChanges = () => {
    if (!selectedSlug) return;
    const live = getProduct(selectedSlug);
    if (live) setDraft(structuredClone(live));
    setDirty(false);
    setSavedMsg(false);
  };

  const backToList = () => {
    if (dirty) {
      const ok = window.confirm(
        "Tenés cambios sin guardar. ¿Salir sin guardar?"
      );
      if (!ok) return;
    }
    setSelectedSlug(null);
    setDraft(null);
    setDirty(false);
    setSavedMsg(false);
  };

  const outTotal = items.filter((i) => i.tone === "out").length;
  const lowTotal = items.filter((i) => i.tone === "low").length;

  const productAlerts = useMemo(() => {
    const map = new Map<string, ProductAlert>();
    for (const item of items) {
      const prev = map.get(item.slug);
      if (!prev) {
        const p = products.find((x) => x.slug === item.slug);
        map.set(item.slug, {
          slug: item.slug,
          name: item.name,
          brand: item.brand,
          image: p ? productImage(p) : "/assets/products/product-1.webp",
          out: item.tone === "out" ? 1 : 0,
          low: item.tone === "low" ? 1 : 0,
          total: 1,
        });
      } else {
        prev.total += 1;
        if (item.tone === "out") prev.out += 1;
        else prev.low += 1;
      }
    }
    return [...map.values()].sort(
      (a, b) =>
        b.out - a.out || b.low - a.low || a.name.localeCompare(b.name, "es")
    );
  }, [items, products]);

  const brands = useMemo(
    () =>
      [...new Set(productAlerts.map((p) => p.brand))].sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [productAlerts]
  );

  const filteredProducts = useMemo(() => {
    const query = q.trim().toLowerCase();
    return productAlerts.filter((p) => {
      if (brand !== "all" && p.brand !== brand) return false;
      if (tone === "out" && p.out === 0) return false;
      if (tone === "low" && p.low === 0) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      );
    });
  }, [productAlerts, q, tone, brand]);

  const inventorySummary = useMemo(() => {
    let units = 0;
    let talles = 0;
    for (const p of products) {
      if (p.active === false) continue;
      for (const v of p.variants) {
        for (const s of v.sizes) {
          const qty = sizeQty(s);
          units += qty;
          if (qty > 0) talles += 1;
        }
      }
    }
    return { units, talles };
  }, [products]);

  const selectedAlert = selectedSlug
    ? productAlerts.find((p) => p.slug === selectedSlug)
    : null;
  const selectedProduct = draft;

  if (selectedProduct && selectedAlert) {
    return (
      <div className="space-y-6 pb-24">
        <div>
          <button
            type="button"
            onClick={backToList}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
          >
            <ArrowLeft className="size-3.5" />
            Volver a modelos
          </button>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="relative size-20 shrink-0 bg-[#f5f4f0] sm:size-24">
                <Image
                  src={productImage(selectedProduct)}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="96px"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
                  {selectedProduct.brand}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl md:text-4xl">
                  {selectedProduct.name}
                </h1>
                <p className="mt-2 text-sm text-soft">
                  Resumen de alertas del modelo (talles con problemas)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold tracking-[0.06em] uppercase">
                  <span className="border border-red-200 bg-red-50 px-1.5 py-0.5 text-red-600">
                    {selectedAlert.out} agotado
                    {selectedAlert.out === 1 ? "" : "s"}
                  </span>
                  <span className="border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-orange-700">
                    {selectedAlert.low} con pocas unidades
                  </span>
                </div>
              </div>
            </div>
            <Link
              href={`/admin/productos/${selectedProduct.slug}/editar`}
              className="btn-press inline-flex w-fit border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
            >
              Editar ficha
            </Link>
          </div>
          <p className="mt-3 text-xs text-soft">
            Ajustá las cantidades por color y talle. Después tocá{" "}
            <span className="font-semibold text-[#222222]">Guardar cambios</span>
            .
          </p>
        </div>

        <div className="space-y-4">
          {selectedProduct.variants.map((variant) => {
            const sizes = [...variant.sizes].sort(
              (a, b) =>
                Number(a.label) - Number(b.label) ||
                a.label.localeCompare(b.label)
            );
            const outCount = sizes.filter(
              (s) => stockLevelTone(sizeQty(s)) === "out"
            ).length;
            const lowCount = sizes.filter(
              (s) => stockLevelTone(sizeQty(s)) === "low"
            ).length;
            const okCount = sizes.filter(
              (s) => stockLevelTone(sizeQty(s)) === "ok"
            ).length;

            return (
              <section
                key={variant.id}
                className="border border-black/5 bg-white p-4 md:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 bg-[#f5f4f0]">
                      <Image
                        src={variant.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wide">
                        {variant.name}
                      </h2>
                      <p className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold tracking-[0.06em] uppercase">
                        <span className="border border-red-200 bg-red-50 px-1.5 py-0.5 text-red-600">
                          {outCount} agotado{outCount === 1 ? "" : "s"}
                        </span>
                        <span className="border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-orange-700">
                          {lowCount} con pocas (≤{LOW_STOCK_THRESHOLD})
                        </span>
                        <span className="border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                          {okCount} con stock OK (+{LOW_STOCK_THRESHOLD})
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold">{variant.price}</p>
                    <Link
                      href={`/admin/productos/${selectedProduct.slug}/editar?variant=${encodeURIComponent(variant.id)}`}
                      className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
                    >
                      Editar color
                    </Link>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                  {sizes.map((s) => {
                    const qty = sizeQty(s);
                    const level = stockLevelClasses(qty);
                    return (
                      <label
                        key={s.label}
                        className={`border px-2 py-2.5 text-center ${level.box}`}
                      >
                        <span className="block text-sm font-bold">{s.label}</span>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={qty}
                          onChange={(e) =>
                            updateSizeQty(
                              variant.id,
                              s.label,
                              Number(e.target.value)
                            )
                          }
                          className={`mt-1 w-full border-0 bg-transparent text-center text-[12px] font-semibold outline-none ${level.text}`}
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur md:left-60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-soft sm:text-sm">
              {dirty ? (
                <span className="font-semibold text-orange-700">
                  Hay cambios sin guardar
                </span>
              ) : savedMsg ? (
                <span className="font-semibold text-emerald-700">
                  Cambios guardados
                </span>
              ) : (
                "Editá cantidades y guardá cuando termines"
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!dirty}
                onClick={discardChanges}
                className="btn-press border border-black/15 px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase disabled:cursor-not-allowed disabled:opacity-40"
              >
                Descartar
              </button>
              <button
                type="button"
                disabled={!dirty}
                onClick={saveChanges}
                className="btn-press bg-[#222222] px-5 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-40"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Operación
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          Stock bajo
        </h1>
        <p className="mt-2 max-w-xl text-sm text-soft">
          Fuente: planilla E-commerce. Los cambios acá también actualizan ese stock.
        </p>
        <p className="mt-1 text-sm text-soft">
          Rojo sin stock · Naranja ≤ {LOW_STOCK_THRESHOLD} u. · Verde +
          {LOW_STOCK_THRESHOLD} · {outTotal} sin stock · {lowTotal} bajos ·{" "}
          {productAlerts.length} modelos
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold tracking-[0.1em] uppercase">
          <span className="border border-red-200 bg-red-50 px-2 py-1 text-red-600">
            Rojo = agotado (0 u.)
          </span>
          <span className="border border-orange-200 bg-orange-50 px-2 py-1 text-orange-700">
            Naranja = pocas (1–{LOW_STOCK_THRESHOLD} u.)
          </span>
          <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
            Verde = stock OK (+{LOW_STOCK_THRESHOLD} u.)
          </span>
        </div>
        <p className="mt-1 text-xs text-soft">
          Inventario activo: {inventorySummary.units} unidades ·{" "}
          {inventorySummary.talles} talles con stock
        </p>
      </div>

      <div className="flex flex-col gap-3 border border-black/5 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="relative min-w-0 flex-1 sm:min-w-[220px]">
          <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Buscar modelo
          </span>
          <span className="pointer-events-none absolute top-[30px] left-3 text-soft">
            <Search className="size-3.5" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nike, Samba, Dunk…"
            className="w-full border border-black/10 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#222222]"
          />
        </label>

        <FancySelect
          label="Estado"
          value={tone}
          options={[
            { value: "all", label: "Todos" },
            { value: "out", label: "Con sin stock" },
            { value: "low", label: "Con bajos" },
          ]}
          onChange={(value) => setTone(value as ToneFilter)}
          className="sm:w-44"
        />

        <FancySelect
          label="Marca"
          value={brand}
          options={[
            { value: "all", label: "Todas" },
            ...brands.map((b) => ({ value: b, label: b })),
          ]}
          onChange={setBrand}
          className="sm:w-44"
        />

        {(q || tone !== "all" || brand !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTone("all");
              setBrand("all");
            }}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2 sm:mb-2.5"
          >
            Limpiar
          </button>
        )}
      </div>

      {productAlerts.length === 0 ? (
        <p className="border border-black/5 bg-white px-5 py-10 text-center text-sm text-soft">
          No hay alertas. Todo el catálogo activo tiene buen surtido.
        </p>
      ) : filteredProducts.length === 0 ? (
        <p className="border border-black/5 bg-white px-5 py-10 text-center text-sm text-soft">
          No hay modelos con esos filtros.
        </p>
      ) : (
        <div className="border border-black/5 bg-white">
          <div className="border-b border-black/5 bg-[#f5f4f0] px-4 py-2 text-xs text-soft">
            {filteredProducts.length} modelo
            {filteredProducts.length === 1 ? "" : "s"} — tocá uno para ver
            talles
          </div>
          <ul className="divide-y divide-black/5">
            {filteredProducts.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(p.slug)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f5f4f0] sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div className="relative size-14 shrink-0 bg-[#f5f4f0] sm:size-16">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      className="object-contain p-1.5"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase">
                      {p.brand}
                    </p>
                    <p className="truncate font-medium uppercase sm:text-base">
                      {p.name}
                    </p>
                    <p className="mt-1 text-xs text-soft">
                      {p.total} alerta{p.total === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                    {p.out > 0 && (
                      <span className="border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase">
                        {p.out} agotado{p.out === 1 ? "" : "s"}
                      </span>
                    )}
                    {p.low > 0 && (
                      <span className="border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase">
                        {p.low} con pocas
                      </span>
                    )}
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase sm:ml-2">
                      Ver →
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-soft">
        Al confirmar un pedido se descuenta stock del talle vendido. Entrá a un
        modelo para ver todos los colores y talles.
      </p>
    </div>
  );
}
