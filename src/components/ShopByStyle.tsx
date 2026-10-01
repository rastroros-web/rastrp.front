"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import BlurText from "@/components/BlurText";
import { ProductCard } from "@/components/ProductCard";
import { uniqueCardsBySlug, type ProductCardModel } from "@/data/catalog";

const NOT_SNEAKER = /zueco|sandalia|ojota|slipper/i;

type Tab = {
  id: string;
  label: string;
  href: string;
  match: (p: ProductCardModel) => boolean;
};

const TABS: Tab[] = [
  { id: "todo", label: "Todo", href: "/productos", match: () => true },
  {
    id: "zapatillas",
    label: "Zapatillas",
    href: "/productos",
    match: (p) => p.brand !== "Rastro" && !NOT_SNEAKER.test(p.name),
  },
  { id: "zuecos", label: "Zuecos", href: "/productos?q=zueco", match: (p) => /zueco/i.test(p.name) },
  {
    id: "sandalias",
    label: "Sandalias y ojotas",
    href: "/summer",
    match: (p) => /sandalia|ojota|slipper/i.test(p.name),
  },
  { id: "rastro", label: "Marca Rastro", href: "/productos?marca=rastro", match: (p) => p.brand === "Rastro" },
  { id: "sale", label: "Mega Sale", href: "/mega-sale", match: (p) => Boolean(p.megaSale) },
];

const LIMIT = 8;

/** Mezcla marcas para que "Todo" no arranque con un solo tipo de producto. */
function interleaveByBrand(cards: ProductCardModel[]) {
  const groups = new Map<string, ProductCardModel[]>();
  for (const card of cards) {
    const list = groups.get(card.brand) ?? [];
    list.push(card);
    groups.set(card.brand, list);
  }
  const queues = [...groups.values()];
  const out: ProductCardModel[] = [];
  while (queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

export function ShopByStyle({ products }: { products: ProductCardModel[] }) {
  const models = useMemo(() => uniqueCardsBySlug(products), [products]);
  const tabs = useMemo(() => TABS.filter((t) => models.some(t.match)), [models]);
  const [activeId, setActiveId] = useState("todo");
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const items = useMemo(() => {
    if (!active) return [];
    const filtered = models.filter(active.match);
    return (active.id === "todo" ? interleaveByBrand(filtered) : filtered).slice(0, LIMIT);
  }, [models, active]);

  return (
    <section id="encontra-tu-par" className="mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-14">
      <div className="mb-6 flex flex-col items-center text-center md:mb-8">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Explorá la tienda
        </p>
        <BlurText
          text="Encontrá tu par"
          delay={80}
          animateBy="words"
          direction="top"
          className="justify-center font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-6xl"
        />
      </div>

      {tabs.length > 1 && (
        <div className="-mx-4 mb-7 overflow-x-auto px-4 [scrollbar-width:none] md:mb-10 [&::-webkit-scrollbar]:hidden">
          <div role="tablist" className="mx-auto flex w-max gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const selected = tab.id === active?.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(tab.id)}
                  className={`relative shrink-0 border px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors sm:px-5 ${
                    selected
                      ? "border-[#222222] text-white"
                      : "border-black/15 text-[#222222] hover:border-[#222222]"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="shop-by-style-pill"
                      className="absolute inset-0 bg-[#222222]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        key={active?.id}
        role="tabpanel"
        className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10"
      >
        {items.map((product, index) => (
          <ProductCard
            key={`${product.slug}-${product.variantId}`}
            product={product}
            index={index}
          />
        ))}
      </div>

      {active && (
        <div className="mt-8 flex justify-center md:mt-10">
          <Link
            href={active.href}
            className="btn-press inline-flex items-center justify-center border border-[#222222] px-6 py-3 text-[11px] font-semibold tracking-[0.16em] uppercase transition hover:bg-[#222222] hover:text-white"
          >
            {active.id === "todo" ? "Ver catálogo completo" : `Ver todo ${active.label}`}
          </Link>
        </div>
      )}
    </section>
  );
}
