"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";

export default function AdminReportesPage() {
  const { orders, products, promos } = useStore();
  const valid = orders.filter((o) => o.status !== "cancelado");

  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const avg = valid.length ? revenue / valid.length : 0;
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const byPayment = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const o of valid) {
      const cur = map[o.paymentMethod] ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += o.total;
      map[o.paymentMethod] = cur;
    }
    return Object.entries(map);
  }, [valid]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of valid) {
      for (const item of o.items) {
        const cur = map.get(item.productSlug) ?? {
          name: item.productName,
          qty: 0,
          revenue: 0,
        };
        cur.qty += item.qty;
        cur.revenue +=
          (o.total / Math.max(o.items.reduce((s, i) => s + i.qty, 0), 1)) *
          item.qty;
        map.set(item.productSlug, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [valid]);

  const couponStats = useMemo(() => {
    return promos.map((p) => {
      const used = valid.filter((o) => o.promoCode === p.code);
      const discount = used.reduce((s, o) => s + (o.discount ?? 0), 0);
      return { code: p.code, label: p.label, uses: used.length, discount };
    });
  }, [valid, promos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Operación
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-soft">
            Ventas mock · {valid.length} pedidos válidos · {products.length}{" "}
            productos
          </p>
        </div>
        <Link
          href="/admin/stock"
          className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold uppercase"
        >
          Ver stock bajo
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Ingresos", value: formatMoney(revenue) },
          { label: "Ticket promedio", value: formatMoney(avg) },
          { label: "Pedidos", value: String(valid.length) },
          {
            label: "Con cupón",
            value: String(valid.filter((o) => o.promoCode).length),
          },
        ].map((s) => (
          <div key={s.label} className="border border-black/5 bg-white p-4">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              {s.label}
            </p>
            <p className="mt-2 text-xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-black/5 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Por estado
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {byStatus.map(([status, count]) => (
              <li key={status} className="flex justify-between capitalize">
                <span className="text-soft">{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
            {byStatus.length === 0 && (
              <li className="text-soft">Sin datos</li>
            )}
          </ul>
        </section>

        <section className="border border-black/5 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Por medio de pago
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {byPayment.map(([method, data]) => (
              <li key={method} className="flex justify-between gap-3">
                <span className="capitalize text-soft">{method}</span>
                <span className="text-right font-medium">
                  {data.count} · {formatMoney(data.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="border border-black/5 bg-white">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Top productos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Producto</th>
                <th className="px-5 py-3 font-semibold">Unidades</th>
                <th className="px-5 py-3 font-semibold">Approx. $</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name} className="border-t border-black/5">
                  <td className="px-5 py-3 font-medium uppercase">{p.name}</td>
                  <td className="px-5 py-3">{p.qty}</td>
                  <td className="px-5 py-3">{formatMoney(p.revenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-soft">
                    Sin ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-black/5 bg-white">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Uso de cupones
          </h2>
          <Link
            href="/admin/cupones"
            className="text-[11px] font-semibold uppercase underline"
          >
            Ver reglas
          </Link>
        </div>
        <ul className="divide-y divide-black/5">
          {couponStats.map((c) => (
            <li
              key={c.code}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <div>
                <p className="font-semibold">{c.code}</p>
                <p className="text-xs text-soft">{c.label}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{c.uses} usos</p>
                <p className="text-xs text-[#16a34a]">
                  −{formatMoney(c.discount)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
