"use client";

import { FormEvent, useMemo, useState } from "react";
import { useBusiness } from "@/components/admin/BusinessProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney, uid } from "@/lib/mock/money";
import {
  GASTOS_MENSUALES_INGRESOS_DEFAULT,
  sumField,
} from "@/lib/mock/business";
import { MONTHS, cell, moneyOrDash } from "@/lib/mock/sheetCols";

export default function GestionGastosFijosPage() {
  const {
    ready,
    data,
    saveGastoFijo,
    deleteGastoFijo,
    saveGastoMensual,
    setGastosMensualesIngresos,
  } = useBusiness();
  const [open, setOpen] = useState(false);
  const total = sumField(data.gastosFijos, (g) => g.montoMensual);
  const ingresos =
    data.gastosMensualesIngresos ?? GASTOS_MENSUALES_INGRESOS_DEFAULT;

  const monthTotals = useMemo(() => {
    const gastos = {
      enero: sumField(data.gastosMensuales, (g) => Number(g.enero) || 0),
      febrero: sumField(data.gastosMensuales, (g) => Number(g.febrero) || 0),
      marzo: sumField(data.gastosMensuales, (g) => Number(g.marzo) || 0),
    };
    return {
      gastos,
      ingresos,
      saldo: {
        enero: ingresos.enero - gastos.enero,
        febrero: ingresos.febrero - gastos.febrero,
        marzo: ingresos.marzo - gastos.marzo,
      },
    };
  }, [data.gastosMensuales, ingresos]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    saveGastoFijo({
      id: uid("gf"),
      area: String(fd.get("area") || "").trim(),
      nombre: String(fd.get("nombre") || "").trim(),
      montoMensual: Number(fd.get("monto") || 0),
    });
    e.currentTarget.reset();
    setOpen(false);
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Gastos fijos"
        description="Hojas GASTOS FIJOS + GASTOS MENSUALES · Enero / Febrero / Marzo como en el Excel"
        actions={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold text-white uppercase"
          >
            {open ? "Cerrar" : "Agregar fijo"}
          </button>
        }
      />

      <AdminStat label="Total mensual fijos" value={formatMoney(total)} />

      {open && (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 border border-black/5 bg-white p-4 sm:grid-cols-4"
        >
          <input name="area" placeholder="Área (ej. MARKETING)" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="nombre" placeholder="Nombre" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="monto" type="number" placeholder="Monto mensual" className="border border-black/10 px-3 py-2 text-sm" required />
          <button type="submit" className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase">
            Guardar
          </button>
        </form>
      )}

      <AdminTableShell title="GASTOS FIJOS">
        <table className="min-w-max">
          <thead className="bg-[#f5f4f0]">
            <tr>
              <th className={adminTh}>Área</th>
              <th className={adminTh}>Nombre / Receptor</th>
              <th className={adminTh}>Monto mensual</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {data.gastosFijos.map((g) => (
              <tr key={g.id}>
                <td className={adminTd}>{cell(g.area)}</td>
                <td className={adminTd}>{cell(g.nombre)}</td>
                <td className={adminTd}>
                  {moneyOrDash(g.montoMensual, formatMoney)}
                </td>
                <td className={adminTd}>
                  <button
                    type="button"
                    onClick={() => deleteGastoFijo(g.id)}
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

      <AdminTableShell title="GASTOS MENSUALES (Enero · Febrero · Marzo)">
        <table className="min-w-max">
          <thead className="bg-[#f5f4f0]">
            <tr>
              <th className={adminTh} />
              {MONTHS.map((m) => (
                <th key={m} className={adminTh}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.gastosMensuales.map((g) => (
              <tr key={g.id}>
                <td className={adminTd}>{cell(g.concepto)}</td>
                {MONTHS.map((m) => (
                  <td key={m} className={adminTd}>
                    <input
                      type="number"
                      value={Number(g[m]) || 0}
                      onChange={(e) =>
                        saveGastoMensual({
                          ...g,
                          [m]: Number(e.target.value) || 0,
                        })
                      }
                      className="w-28 border border-black/10 px-2 py-1 text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className={`${adminTd} font-semibold`}>Total gastos</td>
              {MONTHS.map((m) => (
                <td key={m} className={`${adminTd} font-semibold`}>
                  {formatMoney(monthTotals.gastos[m])}
                </td>
              ))}
            </tr>
            <tr>
              <td className={adminTd}>Total ingresos</td>
              {MONTHS.map((m) => (
                <td key={m} className={adminTd}>
                  <input
                    type="number"
                    value={ingresos[m]}
                    onChange={(e) =>
                      setGastosMensualesIngresos({
                        ...ingresos,
                        [m]: Number(e.target.value) || 0,
                      })
                    }
                    className="w-28 border border-black/10 px-2 py-1 text-sm"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td className={`${adminTd} font-semibold`}>Saldo</td>
              {MONTHS.map((m) => (
                <td key={m} className={`${adminTd} font-semibold`}>
                  {formatMoney(monthTotals.saldo[m])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
