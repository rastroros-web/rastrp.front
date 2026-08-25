"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/components/store/StoreProvider";

export default function AdminProductsPage() {
  const { products, deleteProduct, toggleProductActive } = useStore();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.slug.includes(query)
    );
  }, [products, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Catálogo
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Productos
          </h1>
          <p className="mt-1 text-sm text-soft">{products.length} productos</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex w-fit bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
        >
          Nuevo producto
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, marca o slug…"
        className="w-full max-w-md border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
      />

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => {
          const v = p.variants[0];
          return (
            <div key={p.slug} className="border border-black/5 bg-white p-3">
              <div className="flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden bg-[#f5f4f0]">
                  {v?.image && (
                    <Image
                      src={v.image}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{p.name}</p>
                  <p className="mt-0.5 text-xs text-soft">
                    {p.brand} · {v?.price ?? "—"}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleProductActive(p.slug)}
                    className={`mt-1 text-[11px] font-semibold uppercase ${
                      p.active === false ? "text-soft" : "text-[#16a34a]"
                    }`}
                  >
                    {p.active === false ? "Inactivo" : "Activo"}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 border-t border-black/5 pt-3">
                <Link
                  href={`/admin/productos/${p.slug}/editar`}
                  className="text-[11px] font-semibold uppercase underline"
                >
                  Editar
                </Link>
                <Link
                  href={`/productos/${p.slug}`}
                  className="text-[11px] font-semibold uppercase text-soft underline"
                >
                  Ver
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar ${p.name}?`)) deleteProduct(p.slug);
                  }}
                  className="text-[11px] font-semibold text-red-600 uppercase"
                >
                  Borrar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-black/5 bg-white md:block">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Marca</th>
              <th className="px-4 py-3 font-semibold">Variantes</th>
              <th className="px-4 py-3 font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const v = p.variants[0];
              return (
                <tr key={p.slug} className="border-t border-black/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden bg-[#f5f4f0]">
                        {v?.image && (
                          <Image
                            src={v.image}
                            alt=""
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-soft">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.brand}</td>
                  <td className="px-4 py-3">{p.variants.length}</td>
                  <td className="px-4 py-3">{v?.price ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleProductActive(p.slug)}
                      className={`text-[11px] font-semibold uppercase ${
                        p.active === false ? "text-soft" : "text-[#16a34a]"
                      }`}
                    >
                      {p.active === false ? "Inactivo" : "Activo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/productos/${p.slug}/editar`}
                        className="text-[11px] font-semibold uppercase underline"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/productos/${p.slug}`}
                        className="text-[11px] font-semibold uppercase text-soft underline"
                      >
                        Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${p.name}?`)) deleteProduct(p.slug);
                        }}
                        className="text-[11px] font-semibold text-red-600 uppercase"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
