"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import type { OrderStatus } from "@/lib/mock/types";

const STATUSES: OrderStatus[] = [
  "pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!query) return true;
      return (
        o.id.toLowerCase().includes(query) ||
        o.userEmail.toLowerCase().includes(query) ||
        o.userName.toLowerCase().includes(query) ||
        (o.trackingCode?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [orders, q, status]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Ventas
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-soft">
          {filtered.length} de {orders.length} pedidos
        </p>
      </div>

      <div className="flex flex-col gap-3 border border-black/5 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="relative min-w-0 flex-1 sm:min-w-[240px]">
          <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Buscar
          </span>
          <span className="pointer-events-none absolute top-[30px] left-3 text-soft">
            <Search className="size-3.5" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nº de orden, email o nombre…"
            className="w-full border border-black/10 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#222222]"
          />
        </label>

        <label className="sm:w-44">
          <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Estado
          </span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "all" | OrderStatus)
            }
            className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-[#222222]"
          >
            <option value="all">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {(q || status !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setStatus("all");
            }}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2 sm:mb-2.5"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((o) => (
          <div key={o.id} className="border border-black/5 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/admin/pedidos/${o.id}`}
                  className="font-medium underline"
                >
                  {o.id}
                </Link>
                <p className="mt-1 truncate text-sm">{o.userName}</p>
                <p className="truncate text-xs text-soft">{o.userEmail}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {formatMoney(o.total)}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-soft">
              <span>{o.items.reduce((s, i) => s + i.qty, 0)} items</span>
              <span>·</span>
              <span className="capitalize">{o.paymentMethod}</span>
              <span>·</span>
              <span>{new Date(o.createdAt).toLocaleDateString("es-AR")}</span>
            </div>
            <select
              value={o.status}
              onChange={(e) =>
                updateOrderStatus(o.id, e.target.value as OrderStatus)
              }
              className="mt-3 w-full border border-black/10 bg-white px-2 py-2 text-xs capitalize"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Link
              href={`/admin/pedidos/${o.id}`}
              className="mt-3 flex w-full items-center justify-center border border-[#222222] px-3 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase"
            >
              Ver detalle completo
            </Link>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-soft">
            {orders.length === 0
              ? "Sin pedidos"
              : "No hay pedidos con esa búsqueda"}
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-black/5 bg-white md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Pedido</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Pago</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className="border-t border-black/5 transition hover:bg-[#f5f4f0]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-medium underline"
                  >
                    {o.id}
                  </Link>
                  {o.trackingCode && (
                    <p className="mt-0.5 font-mono text-[10px] text-soft">
                      {o.trackingCode}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p>{o.userName}</p>
                  <p className="text-xs text-soft">{o.userEmail}</p>
                </td>
                <td className="px-4 py-3">
                  {o.items.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td className="px-4 py-3">{formatMoney(o.total)}</td>
                <td className="px-4 py-3 capitalize">{o.paymentMethod}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) =>
                      updateOrderStatus(o.id, e.target.value as OrderStatus)
                    }
                    className="border border-black/10 bg-white px-2 py-1.5 text-xs capitalize"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-soft">
                  {new Date(o.createdAt).toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="text-[11px] font-semibold tracking-[0.1em] uppercase underline"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-soft">
            {orders.length === 0
              ? "Sin pedidos"
              : "No hay pedidos con esa búsqueda"}
          </p>
        )}
      </div>
    </div>
  );
}
