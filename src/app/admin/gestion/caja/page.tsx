"use client";

import { FormEvent, useState } from "react";
import { useBusiness } from "@/components/admin/BusinessProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney } from "@/lib/mock/money";
import { cell, moneyOrDash } from "@/lib/mock/sheetCols";

export default function GestionCajaPage() {
  const { ready, data, addCaja, deleteCaja } = useBusiness();
  const [open, setOpen] = useState(false);
  const last = data.caja[0];

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const efectivo = Number(fd.get("efectivo") || 0);
    const personalPay = Number(fd.get("personalPay") || 0);
    addCaja({
      fecha: String(fd.get("fecha") || new Date().toISOString().slice(0, 10)),
      efectivo,
      personalPay,
      total: efectivo + personalPay,
    });
    e.currentTarget.reset();
    setOpen(false);
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Caja"
        description={`Hoja CAJA completa · ${data.caja.length} snapshots`}
        actions={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold text-white uppercase"
          >
            {open ? "Cerrar" : "Nuevo snapshot"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <AdminStat label="Último efectivo" value={formatMoney(last?.efectivo ?? 0)} />
        <AdminStat label="Último Personal Pay" value={formatMoney(last?.personalPay ?? 0)} />
        <AdminStat label="Último total" value={formatMoney(last?.total ?? 0)} />
      </div>

      {open && (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 border border-black/5 bg-white p-4 sm:grid-cols-4"
        >
          <input name="fecha" type="date" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="efectivo" type="number" placeholder="Efectivo" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="personalPay" type="number" placeholder="Personal Pay" className="border border-black/10 px-3 py-2 text-sm" required />
          <button type="submit" className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase">
            Guardar
          </button>
        </form>
      )}

      <AdminTableShell title="CAJA (todas las columnas)">
        <table className="min-w-max">
          <thead className="bg-[#f5f4f0]">
            <tr>
              <th className={adminTh}>Fecha</th>
              <th className={adminTh}>Efectivo</th>
              <th className={adminTh}>Personal Pay</th>
              <th className={adminTh}>Total</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {data.caja.map((c) => (
              <tr key={c.id}>
                <td className={adminTd}>{cell(c.fecha)}</td>
                <td className={adminTd}>{moneyOrDash(c.efectivo, formatMoney)}</td>
                <td className={adminTd}>
                  {moneyOrDash(c.personalPay, formatMoney)}
                </td>
                <td className={adminTd}>{moneyOrDash(c.total, formatMoney)}</td>
                <td className={adminTd}>
                  <button
                    type="button"
                    onClick={() => deleteCaja(c.id)}
                    className="text-[11px] font-semibold uppercase text-soft underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
