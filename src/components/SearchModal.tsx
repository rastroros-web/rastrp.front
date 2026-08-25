"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { flattenCatalog, productMatchesQuery } from "@/data/catalog";

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { products, ready } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!ready || !q.trim()) return [];
    const query = q.trim().toLowerCase();
    return flattenCatalog(products.filter((p) => p.active !== false))
      .filter((p) => productMatchesQuery(p, query))
      .slice(0, 8);
  }, [products, q, ready]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        role="presentation"
        className="absolute inset-0 bg-[rgba(0,0,0,0.45)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-[12vh] w-[min(92vw,560px)] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
          <Search className="size-4 shrink-0 text-soft" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar marca, modelo o color…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-soft"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-soft transition hover:text-[#222222]"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {!q.trim() && (
            <div className="px-4 py-6 text-sm text-soft">
              Probá: <span className="text-[#222222]">dunk</span>,{" "}
              <span className="text-[#222222]">samba</span>,{" "}
              <span className="text-[#222222]">panda</span>
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-soft">
              No encontramos “{q}”
            </p>
          )}
          {results.map((p) => (
            <Link
              key={`${p.slug}-${p.variantId}`}
              href={p.href}
              onClick={onClose}
              className="flex items-center gap-3 border-b border-black/5 px-4 py-3 transition hover:bg-[#f5f4f0]"
            >
              <div className="relative size-14 shrink-0 bg-[#f5f4f0]">
                <Image
                  src={p.local}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
                  {p.brand}
                </p>
                <p className="truncate text-sm font-medium uppercase">
                  {p.name}
                </p>
                <p className="text-xs font-semibold">{p.price}</p>
              </div>
            </Link>
          ))}
          {q.trim() && results.length > 0 && (
            <Link
              href={`/productos?q=${encodeURIComponent(q.trim())}`}
              onClick={onClose}
              className="block px-4 py-3 text-center text-[11px] font-semibold tracking-[0.14em] uppercase underline"
            >
              Ver todos los resultados
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
