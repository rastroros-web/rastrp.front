"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchShopOrders,
  fetchShopUsers,
  getBackendUrl,
  type ShopListUser,
} from "@/lib/api/backend";
import type { MockOrder } from "@/lib/mock/types";
import { formatMoney } from "@/lib/mock/money";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  orders: number;
  spent: number;
  lastOrderAt: string | null;
  createdAt: string | null;
  isActive: boolean;
};

function roleLabel(role: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "STAFF") return "Staff";
  return "Cliente";
}

function buildCustomerRows(
  users: ShopListUser[],
  orders: MockOrder[]
): CustomerRow[] {
  const customers = users.filter((u) => u.role === "CUSTOMER");
  const byUser = new Map<
    string,
    { count: number; spent: number; lastOrderAt: string | null }
  >();

  for (const o of orders) {
    const keys = [
      String(o.userId || "").toLowerCase(),
      String(o.userEmail || "").toLowerCase(),
    ].filter(Boolean);
    for (const key of keys) {
      const prev = byUser.get(key) || {
        count: 0,
        spent: 0,
        lastOrderAt: null as string | null,
      };
      prev.count += 1;
      prev.spent += Number(o.total) || 0;
      if (!prev.lastOrderAt || o.createdAt > prev.lastOrderAt) {
        prev.lastOrderAt = o.createdAt;
      }
      byUser.set(key, prev);
    }
  }

  return customers
    .map((u) => {
      const stats =
        byUser.get(String(u.id)) ||
        byUser.get(u.email.toLowerCase()) || {
          count: 0,
          spent: 0,
          lastOrderAt: null,
        };
      return {
        id: String(u.id),
        name: u.name,
        email: u.email,
        phone: u.phone || u.whatsapp || "",
        city: u.city || "",
        province: u.province || "",
        orders: stats.count,
        spent: stats.spent,
        lastOrderAt: stats.lastOrderAt,
        createdAt: u.createdAt || null,
        isActive: u.isActive !== false,
      };
    })
    .sort((a, b) => {
      if (b.orders !== a.orders) return b.orders - a.orders;
      const aDate = a.lastOrderAt || a.createdAt || "";
      const bDate = b.lastOrderAt || b.createdAt || "";
      return bDate.localeCompare(aDate);
    });
}

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<ShopListUser[]>([]);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getBackendUrl()) {
        setError("Falta conectar el backend para ver clientes reales.");
        setLoading(false);
        return;
      }
      try {
        const [list, remoteOrders] = await Promise.all([
          fetchShopUsers(),
          fetchShopOrders(),
        ]);
        if (cancelled) return;
        setUsers(list);
        setOrders(remoteOrders);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los clientes"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => buildCustomerRows(users, orders),
    [users, orders]
  );

  const withOrders = rows.filter((r) => r.orders > 0).length;
  const staffCount = users.filter(
    (u) => u.role === "ADMIN" || u.role === "STAFF"
  ).length;

  if (loading) {
    return <p className="text-sm text-soft">Cargando clientes…</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Clientes
        </h1>
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-sm text-soft">
          Entrá con una cuenta admin o staff y recargá la página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          CRM
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          Clientes
        </h1>
        <p className="mt-1 text-sm text-soft">
          {rows.length} clientes · {withOrders} con pedidos
          {staffCount > 0 ? ` · ${staffCount} equipo` : ""}
        </p>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((u) => (
          <div key={u.id} className="border border-black/5 bg-white p-4">
            <p className="font-medium">{u.name}</p>
            <p className="mt-0.5 break-all text-sm text-soft">{u.email}</p>
            {u.phone ? (
              <p className="mt-0.5 text-sm text-soft">{u.phone}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft">
              <span>
                {[u.city, u.province].filter(Boolean).join(", ") || "Sin ciudad"}
              </span>
              <span>
                {u.orders} pedido{u.orders === 1 ? "" : "s"}
              </span>
              <span>{formatMoney(u.spent)}</span>
              <span>
                Alta{" "}
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString("es-AR")
                  : "—"}
              </span>
              {!u.isActive ? (
                <span className="text-red-600">Inactiva</span>
              ) : null}
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="border border-black/5 bg-white px-4 py-8 text-center text-sm text-soft">
            Todavía no hay clientes registrados. Aparecen al crear cuenta o al
            comprar (guest).
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto border border-black/5 bg-white md:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Ciudad</th>
              <th className="px-4 py-3 font-semibold">Pedidos</th>
              <th className="px-4 py-3 font-semibold">Gastado</th>
              <th className="px-4 py-3 font-semibold">Último pedido</th>
              <th className="px-4 py-3 font-semibold">Alta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-medium">
                  {u.name}
                  {!u.isActive ? (
                    <span className="ml-2 text-[10px] font-semibold tracking-wide text-red-600 uppercase">
                      Inactiva
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  {[u.city, u.province].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">{u.orders}</td>
                <td className="px-4 py-3">{formatMoney(u.spent)}</td>
                <td className="px-4 py-3 text-soft">
                  {u.lastOrderAt
                    ? new Date(u.lastOrderAt).toLocaleDateString("es-AR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-soft">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("es-AR")
                    : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-soft"
                >
                  Todavía no hay clientes registrados. Aparecen al crear cuenta o
                  al comprar (guest).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {users.some((u) => u.role !== "CUSTOMER") ? (
        <details className="border border-black/5 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide">
            Equipo ({staffCount})
          </summary>
          <ul className="mt-3 space-y-2 text-sm">
            {users
              .filter((u) => u.role === "ADMIN" || u.role === "STAFF")
              .map((u) => (
                <li key={u.id} className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-soft">{u.email}</span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase text-brand">
                    {roleLabel(u.role)}
                  </span>
                </li>
              ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
