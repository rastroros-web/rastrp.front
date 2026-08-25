"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/components/store/StoreProvider";
import { useBusiness } from "@/components/admin/BusinessProvider";
import { formatMoney } from "@/lib/mock/money";
import { getLowStockItems } from "@/lib/mock/lowStock";
import { sumField } from "@/lib/mock/business";
import { setShopUserRole } from "@/lib/api/backend";

function RoleAssignCard() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"ADMIN" | "STAFF" | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function assign(role: "ADMIN" | "STAFF") {
    setError("");
    setOk("");
    setBusy(role);
    try {
      const user = await setShopUserRole(email, role);
      const label = role === "ADMIN" ? "admin" : "staff";
      setOk(`${user.email} ahora es ${label}. Que recargue o vuelva a entrar.`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border border-black/5 bg-white p-4 sm:p-5">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
        Equipo
      </p>
      <h2 className="mt-1 text-sm font-semibold uppercase tracking-wide">
        Hacer staff o admin
      </h2>
      <p className="mt-1 text-sm text-soft">
        Ingresá el correo de una cuenta ya registrada.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#222222] sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!email.trim() || Boolean(busy)}
            onClick={() => assign("ADMIN")}
            className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-40"
          >
            {busy === "ADMIN" ? "Guardando…" : "Hacer admin"}
          </button>
          <button
            type="button"
            disabled={!email.trim() || Boolean(busy)}
            onClick={() => assign("STAFF")}
            className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase disabled:opacity-40"
          >
            {busy === "STAFF" ? "Guardando…" : "Hacer staff"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-emerald-700">{ok}</p> : null}
    </section>
  );
}

export default function AdminDashboardPage() {
  const { products, orders, users, cartCount, session } = useStore();
  const { data: business, ready: businessReady } = useBusiness();
  const isAdmin = session?.role === "admin";
  const activeProducts = products.filter((p) => p.active !== false).length;
  const revenue = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "pendiente").length;
  const customers = users.filter((u) => u.role === "customer").length;
  const lowStock = useMemo(() => getLowStockItems(products), [products]);

  const recent = orders.slice(0, 5);

  const excelVentas = businessReady
    ? sumField(business.ventas, (v) => v.total)
    : 0;
  const excelGastosFijos = businessReady
    ? sumField(business.gastosFijos, (g) => g.montoMensual)
    : 0;
  const excelStock = businessReady
    ? business.ecommerce.reduce(
        (s, r) => s + Object.values(r.stock).reduce((a, b) => a + b, 0),
        0
      )
    : 0;

  const stats = [
    { label: "Ventas tienda", value: formatMoney(revenue) },
    { label: "Pedidos", value: String(orders.length) },
    { label: "Pendientes", value: String(pending) },
    { label: "Productos activos", value: String(activeProducts) },
    { label: "Clientes", value: String(customers) },
    { label: "Stock bajo", value: String(lowStock.length) },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Overview
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <Link
              href="/admin/gestion"
              className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Planilla Excel
            </Link>
          ) : null}
          <Link
            href="/admin/productos/nuevo"
            className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            Nuevo producto
          </Link>
          <Link
            href="/admin/reportes"
            className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            Reportes
          </Link>
        </div>
      </div>

      {isAdmin ? <RoleAssignCard /> : null}

      {isAdmin && businessReady && (
        <section className="border border-black/5 bg-white p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
                Planilla Rastro
              </p>
              <p className="mt-0.5 text-sm text-soft">
                Datos del Excel · {business.ventas.length} ventas ·{" "}
                {business.ecommerce.length} variantes
              </p>
            </div>
            <Link
              href="/admin/gestion"
              className="text-[11px] font-semibold uppercase underline"
            >
              Abrir gestión
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="bg-[#f5f4f0] p-3">
              <p className="text-[9px] font-semibold tracking-[0.12em] text-soft uppercase">
                Ventas Excel
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatMoney(excelVentas)}
              </p>
            </div>
            <div className="bg-[#f5f4f0] p-3">
              <p className="text-[9px] font-semibold tracking-[0.12em] text-soft uppercase">
                Gastos fijos / mes
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatMoney(excelGastosFijos)}
              </p>
            </div>
            <div className="bg-[#f5f4f0] p-3">
              <p className="text-[9px] font-semibold tracking-[0.12em] text-soft uppercase">
                Pares e-commerce
              </p>
              <p className="mt-1 text-lg font-semibold">{excelStock}</p>
            </div>
            <div className="bg-[#f5f4f0] p-3">
              <p className="text-[9px] font-semibold tracking-[0.12em] text-soft uppercase">
                Última caja
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatMoney(business.caja[0]?.total ?? 0)}
              </p>
            </div>
          </div>
        </section>
      )}

      {lowStock.length > 0 && (
        <Link
          href="/admin/stock"
          className="flex flex-wrap items-center justify-between gap-3 border border-brand/30 bg-brand/5 px-4 py-3 transition hover:bg-brand/10"
        >
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
              Alerta stock
            </p>
            <p className="mt-0.5 text-sm">
              {lowStock.length} variantes con pocos talles o sin stock
            </p>
          </div>
          <span className="text-[11px] font-semibold uppercase underline">
            Ver alertas
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-black/5 bg-white p-3 sm:p-5">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-soft uppercase sm:text-[10px] sm:tracking-[0.16em]">
              {s.label}
            </p>
            <p className="mt-1.5 text-lg font-semibold sm:mt-2 sm:text-2xl">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <section className="border border-black/5 bg-white">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Últimos pedidos
          </h2>
          <Link
            href="/admin/pedidos"
            className="text-[11px] font-semibold uppercase underline"
          >
            Ver todos
          </Link>
        </div>

        <div className="divide-y divide-black/5 md:hidden">
          {recent.map((o) => (
            <Link
              key={o.id}
              href={`/admin/pedidos/${o.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{o.id}</p>
                <p className="truncate text-xs text-soft">{o.userName}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium">{formatMoney(o.total)}</p>
                <p className="text-xs capitalize text-soft">{o.status}</p>
              </div>
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-soft">
              Sin pedidos todavía
            </p>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Pedido</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-black/5">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="font-medium underline"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{o.userName}</td>
                  <td className="px-5 py-3">{formatMoney(o.total)}</td>
                  <td className="px-5 py-3 capitalize">{o.status}</td>
                  <td className="px-5 py-3 text-soft">
                    {new Date(o.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-soft">
                    Sin pedidos todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-xs text-soft">
        {isAdmin ? (
          <>
            <Link href="/admin/gestion" className="underline">
              Gestión Excel
            </Link>
            <span>·</span>
          </>
        ) : null}
        <Link href="/admin/cupones" className="underline">
          Cupones
        </Link>
        <span>·</span>
        <Link href="/admin/stock" className="underline">
          Stock bajo
        </Link>
        <span>·</span>
        <span>Items en carrito actual: {cartCount}</span>
      </div>
    </div>
  );
}
