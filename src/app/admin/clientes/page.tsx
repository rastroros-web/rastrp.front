"use client";

import { useStore } from "@/components/store/StoreProvider";

export default function AdminCustomersPage() {
  const { users, orders } = useStore();
  const customers = users.filter((u) => u.role === "customer");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          CRM
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          Clientes
        </h1>
        <p className="mt-1 text-sm text-soft">{customers.length} clientes</p>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {customers.map((u) => {
          const count = orders.filter((o) => o.userId === u.id).length;
          return (
            <div key={u.id} className="border border-black/5 bg-white p-4">
              <p className="font-medium">{u.name}</p>
              <p className="mt-0.5 break-all text-sm text-soft">{u.email}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft">
                <span>{u.city || "Sin ciudad"}</span>
                <span>{count} pedidos</span>
                <span>{new Date(u.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-black/5 bg-white md:block">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Ciudad</th>
              <th className="px-4 py-3 font-semibold">Pedidos</th>
              <th className="px-4 py-3 font-semibold">Alta</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((u) => {
              const count = orders.filter((o) => o.userId === u.id).length;
              return (
                <tr key={u.id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.city || "—"}</td>
                  <td className="px-4 py-3">{count}</td>
                  <td className="px-4 py-3 text-soft">
                    {new Date(u.createdAt).toLocaleDateString("es-AR")}
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
