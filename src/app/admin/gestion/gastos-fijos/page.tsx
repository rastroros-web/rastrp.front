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
import { sumField } from "@/lib/mock/business";
import { datedVentas, monthLabel } from "@/lib/mock/businessStats";
import { cell, moneyOrDash } from "@/lib/mock/sheetCols";
import { isoToArgentinaParts } from "@/lib/argentinaTime";
import { FancySelect } from "@/components/ui/FancySelect";
import { ledgerFecha } from "@/lib/mock/orderLabels";
import type { GastoFijo } from "@/lib/mock/business";

const ALL = "all";

const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function currentArgentinaMonth() {
  const date = isoToArgentinaParts(new Date().toISOString()).date;
  return { year: date.slice(0, 4), month: date.slice(5, 7), date };
}

function gastoFechaIso(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  const iso = ledgerFecha(fecha);
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function gastoMonthKey(fecha: string | null | undefined): string | null {
  const iso = gastoFechaIso(fecha);
  return iso ? iso.slice(0, 7) : null;
}

/** Rige en el período si no tiene fecha (viejo) o si empezó en o antes del mes. */
function rigeEnPeriodo(gasto: GastoFijo, periodEnd: string | null): boolean {
  const start = gastoMonthKey(gasto.fecha);
  if (!start) return true;
  if (!periodEnd) return true;
  return start <= periodEnd;
}

export default function GestionGastosFijosPage() {
  const { ready, data, saveGastoFijo, deleteGastoFijo } = useBusiness();
  const today = currentArgentinaMonth();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [area, setArea] = useState(ALL);
  const [q, setQ] = useState("");

  const areas = useMemo(
    () =>
      [...new Set(data.gastosFijos.map((g) => g.area).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [data.gastosFijos]
  );

  const years = useMemo(() => {
    const set = new Set<string>([today.year]);
    for (const v of datedVentas(data.ventas || [])) {
      if (v.monthKey) set.add(v.monthKey.slice(0, 4));
    }
    for (const g of data.gastosFijos) {
      const key = gastoMonthKey(g.fecha);
      if (key) set.add(key.slice(0, 4));
    }
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [data.ventas, data.gastosFijos, today.year]);

  const periodEnd =
    year !== ALL && month !== ALL
      ? `${year}-${month}`
      : year !== ALL
        ? `${year}-12`
        : null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.gastosFijos
      .filter((g) => {
        if (!rigeEnPeriodo(g, periodEnd)) return false;
        if (area !== ALL && g.area !== area) return false;
        if (!term) return true;
        return (
          g.area.toLowerCase().includes(term) ||
          g.nombre.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const fa = gastoFechaIso(a.fecha) ?? "";
        const fb = gastoFechaIso(b.fecha) ?? "";
        return fb.localeCompare(fa);
      });
  }, [data.gastosFijos, area, q, periodEnd]);

  const monthlyFixed = sumField(filtered, (g) => g.montoMensual);

  const period = useMemo(() => {
    const ventas = datedVentas(data.ventas || []).filter((v) => {
      if (!v.monthKey) return false;
      if (year !== ALL && !v.monthKey.startsWith(year)) return false;
      if (month !== ALL && v.monthKey.slice(5) !== month) return false;
      return true;
    });
    const monthsInPeriod = month !== ALL ? 1 : year !== ALL ? 12 : 1;
    const ventasTotal = sumField(ventas, (v) => Number(v.total) || 0);
    const costo = monthlyFixed * monthsInPeriod;
    const label =
      year === ALL && month === ALL
        ? "por mes"
        : month !== ALL && year !== ALL
          ? monthLabel(`${year}-${month}`)
          : year !== ALL
            ? year
            : MONTH_OPTIONS.find((m) => m.value === month)?.label || month;
    return {
      label,
      monthsInPeriod,
      ventasTotal,
      costo,
      resultado: ventasTotal - costo,
    };
  }, [data.ventas, monthlyFixed, year, month]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rawFecha = String(fd.get("fecha") || "").trim();
    saveGastoFijo({
      id: uid("gf"),
      fecha: gastoFechaIso(rawFecha) || today.date,
      area: String(fd.get("area") || "").trim(),
      nombre: String(fd.get("nombre") || "").trim(),
      montoMensual: Number(fd.get("monto") || 0),
    });
    e.currentTarget.reset();
    setOpen(false);
  }

  function clearFilters() {
    setYear(today.year);
    setMonth(today.month);
    setArea(ALL);
    setQ("");
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  const filtersDirty =
    year !== today.year || month !== today.month || area !== ALL || q.trim();

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Gastos fijos"
        description="Alquiler, sueldos, ads. La fecha es desde cuándo rige: el filtro de año y mes la usa."
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

      <div className="flex flex-col gap-3 border border-black/5 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <FancySelect
          label="Año"
          value={year}
          options={[
            { value: ALL, label: "Todos" },
            ...years.map((y) => ({ value: y, label: y })),
          ]}
          onChange={setYear}
          className="sm:w-36"
        />
        <FancySelect
          label="Mes"
          value={month}
          options={[
            { value: ALL, label: "Todos" },
            ...MONTH_OPTIONS,
          ]}
          onChange={setMonth}
          className="sm:w-44"
        />
        <FancySelect
          label="Área"
          value={area}
          options={[
            { value: ALL, label: "Todas" },
            ...areas.map((a) => ({ value: a, label: a })),
          ]}
          onChange={setArea}
          className="sm:w-44"
        />
        <label className="min-w-0 flex-1 sm:min-w-[200px]">
          <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Buscar
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o receptor…"
            className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
          />
        </label>
        {filtersDirty ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2 sm:mb-2.5"
          >
            Este mes
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <AdminStat label="Fijos por mes" value={formatMoney(monthlyFixed)} />
        <AdminStat
          label={`Costo · ${period.label}`}
          value={formatMoney(period.costo)}
        />
        <AdminStat
          label={`Ventas · ${period.label}`}
          value={formatMoney(period.ventasTotal)}
        />
        <AdminStat
          label={`Resultado · ${period.label}`}
          value={formatMoney(period.resultado)}
        />
      </div>
      <p className="text-xs text-soft">
        El resultado es ventas de la planilla menos estos fijos en el período
        elegido. No incluye costos de mercadería.
      </p>

      {open && (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 border border-black/5 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Fecha
            </span>
            <input
              name="fecha"
              type="date"
              defaultValue={today.date}
              required
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Área
            </span>
            <input
              name="area"
              placeholder="Ej. MARKETING"
              className="w-full border border-black/10 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Nombre / receptor
            </span>
            <input
              name="nombre"
              placeholder="Nombre"
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Monto mensual
            </span>
            <input
              name="monto"
              type="number"
              placeholder="0"
              className="w-full border border-black/10 px-3 py-2 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase sm:self-end"
          >
            Guardar
          </button>
        </form>
      )}

      <AdminTableShell title={`GASTOS FIJOS · ${filtered.length} ítems`}>
        <table className="min-w-max">
          <thead className="bg-[#f5f4f0]">
            <tr>
              <th className={adminTh}>Fecha</th>
              <th className={adminTh}>Área</th>
              <th className={adminTh}>Nombre / Receptor</th>
              <th className={adminTh}>Monto mensual</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id}>
                <td className={adminTd}>{cell(gastoFechaIso(g.fecha))}</td>
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className={`${adminTd} text-soft`}>
                  No hay gastos fijos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
