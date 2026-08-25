"use client";

import { FormEvent, useMemo, useState } from "react";
import { useBusiness } from "@/components/admin/BusinessProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTdWrap,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney } from "@/lib/mock/money";
import { PLANILLA_APERTURA, sumField } from "@/lib/mock/business";
import { cell, moneyOrDash, withPlanillaSaldos } from "@/lib/mock/sheetCols";
import { displayFecha, splitPlanillaDescripcion } from "@/lib/mock/orderLabels";

export default function GestionPlanillaPage() {
  const { ready, data, addPlanilla, deletePlanilla } = useBusiness();
  const [open, setOpen] = useState(false);

  const apertura = data.planillaApertura ?? PLANILLA_APERTURA;
  const rows = useMemo(
    () => withPlanillaSaldos(data.planilla, apertura),
    [data.planilla, apertura]
  );

  const last = rows[rows.length - 1];
  const ingE = sumField(data.planilla, (r) => r.ingresoEfectivo);
  const gasE = sumField(data.planilla, (r) => r.gastoEfectivo);
  const ingB = sumField(data.planilla, (r) => r.ingresoBancario);
  const gasB = sumField(data.planilla, (r) => r.gastoBancario);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addPlanilla({
      fecha: String(fd.get("fecha") || new Date().toISOString().slice(0, 10)),
      descripcion: String(fd.get("descripcion") || "").trim(),
      cliente: String(fd.get("cliente") || "") || null,
      cantidad: Number(fd.get("cantidad") || 0) || null,
      costo: Number(fd.get("costo") || 0) || null,
      ingresoBancario: Number(fd.get("ingresoBancario") || 0),
      gastoBancario: Number(fd.get("gastoBancario") || 0),
      ingresoEfectivo: Number(fd.get("ingresoEfectivo") || 0),
      gastoEfectivo: Number(fd.get("gastoEfectivo") || 0),
    });
    e.currentTarget.reset();
    setOpen(false);
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Planilla diaria"
        description="Hoja PLANILLA DIARIA · 12 columnas del Excel, con saldos corridos. Las ventas de la tienda se anotan acá y en Ventas."
        actions={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold text-white uppercase"
          >
            {open ? "Cerrar" : "Nuevo movimiento"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <AdminStat label="Ing. bancario" value={formatMoney(ingB)} />
        <AdminStat label="Gasto bancario" value={formatMoney(gasB)} />
        <AdminStat label="Ing. efectivo" value={formatMoney(ingE)} />
        <AdminStat label="Gasto efectivo" value={formatMoney(gasE)} />
        <AdminStat
          label="Saldo bancario"
          value={formatMoney(last?.saldoBancario ?? apertura.saldoBancario)}
        />
        <AdminStat
          label="Saldo efectivo"
          value={formatMoney(last?.saldoEfectivo ?? apertura.saldoEfectivo)}
        />
      </div>

      {open && (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 border border-black/5 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input name="fecha" type="date" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="descripcion" placeholder="Descripción" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="cliente" placeholder="Cliente" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="cantidad" type="number" placeholder="Cantidad" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="costo" type="number" placeholder="Costo" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="ingresoBancario" type="number" placeholder="Ingreso bancario" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="gastoBancario" type="number" placeholder="Gasto bancario" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="ingresoEfectivo" type="number" placeholder="Ingreso efectivo" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="gastoEfectivo" type="number" placeholder="Gasto efectivo" className="border border-black/10 px-3 py-2 text-sm" />
          <button type="submit" className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase sm:col-span-2 lg:col-span-3">
            Guardar
          </button>
        </form>
      )}

      <AdminTableShell title="PLANILLA DIARIA (todas las columnas del Excel)">
        <table className="min-w-max">
          <thead className="sticky top-0 z-10 bg-[#f5f4f0]">
            <tr>
              <th className={adminTh} rowSpan={2}>Fecha</th>
              <th className={adminTh} rowSpan={2}>Descripción</th>
              <th className={adminTh} rowSpan={2}>Cliente</th>
              <th className={adminTh} rowSpan={2}>Cantidad</th>
              <th className={adminTh} rowSpan={2}>Costo</th>
              <th className={adminTh}>Ingreso</th>
              <th className={adminTh}>Gasto</th>
              <th className={adminTh}>Saldo bancario</th>
              <th className={adminTh}>Ingreso</th>
              <th className={adminTh}>Gasto</th>
              <th className={adminTh}>Saldo efectivo</th>
              <th className={adminTh}>Saldo bancario</th>
              <th className={adminTh} rowSpan={2} />
            </tr>
            <tr>
              <th className={adminTh}>Bancario</th>
              <th className={adminTh}>Bancario</th>
              <th className={adminTh}>
                {formatMoney(apertura.saldoBancario)}
              </th>
              <th className={adminTh}>Efectivo</th>
              <th className={adminTh}>Efectivo</th>
              <th className={adminTh}>
                {formatMoney(apertura.saldoEfectivo)}
              </th>
              <th className={adminTh}>
                {formatMoney(apertura.saldoBancarioAlt)}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { nombre, talle } = splitPlanillaDescripcion(r.descripcion);
              return (
              <tr key={r.id}>
                <td className={adminTd}>{displayFecha(r.fecha)}</td>
                <td className={`${adminTdWrap} min-w-[220px] max-w-[280px]`}>
                  <p className="font-medium leading-snug">{nombre || "—"}</p>
                  {talle ? (
                    <p className="mt-0.5 text-xs text-soft">Talle {talle}</p>
                  ) : null}
                </td>
                <td className={`${adminTd} min-w-[112px] font-medium`}>
                  {cell(r.cliente)}
                </td>
                <td className={adminTd}>{cell(r.cantidad)}</td>
                <td className={adminTd}>{moneyOrDash(r.costo, formatMoney)}</td>
                <td className={adminTd}>
                  {moneyOrDash(r.ingresoBancario, formatMoney)}
                </td>
                <td className={adminTd}>
                  {moneyOrDash(r.gastoBancario, formatMoney)}
                </td>
                <td className={adminTd}>
                  {formatMoney(r.saldoBancario)}
                </td>
                <td className={adminTd}>
                  {moneyOrDash(r.ingresoEfectivo, formatMoney)}
                </td>
                <td className={adminTd}>
                  {moneyOrDash(r.gastoEfectivo, formatMoney)}
                </td>
                <td className={adminTd}>
                  {formatMoney(r.saldoEfectivo)}
                </td>
                <td className={adminTd}>
                  {formatMoney(r.saldoBancarioAlt)}
                </td>
                <td className={adminTd}>
                  <button
                    type="button"
                    onClick={() => deletePlanilla(r.id)}
                    className="text-[11px] font-semibold uppercase text-soft underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
