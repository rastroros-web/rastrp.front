"use client";

import { useMemo, useState } from "react";
import { useBusiness } from "@/components/admin/BusinessProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTdWrap,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney, uid } from "@/lib/mock/money";
import { SHEET_SIZES, cell, moneyOrDash } from "@/lib/mock/sheetCols";
import type { CostoRow } from "@/lib/mock/business";

type FormState = {
  id: string | null;
  marca: string;
  modelo: string;
  sku: string;
  grada: string;
  calidad: string;
  cantidadXCaja: string;
  costoReal: string;
  cotizacion: string;
  costoArs: string;
  pasEnvio: string;
  valorPublico: string;
  stock: Record<string, string>;
};

const EMPTY_FORM: FormState = {
  id: null,
  marca: "",
  modelo: "",
  sku: "",
  grada: "",
  calidad: "",
  cantidadXCaja: "",
  costoReal: "",
  cotizacion: "",
  costoArs: "",
  pasEnvio: "",
  valorPublico: "",
  stock: {},
};

function toNum(value: string): number | null {
  const raw = value.trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function txt(value: string | number | null | undefined): string {
  return value == null ? "" : String(value);
}

function formFromRow(row: CostoRow): FormState {
  const stock: Record<string, string> = {};
  for (const size of SHEET_SIZES) {
    const qty = row.stock?.[size];
    if (qty != null) stock[size] = String(qty);
  }
  return {
    id: row.id,
    marca: txt(row.marca),
    modelo: txt(row.modelo),
    sku: txt(row.sku),
    grada: txt(row.grada),
    calidad: txt(row.calidad),
    cantidadXCaja: txt(row.cantidadXCaja),
    costoReal: txt(row.costoReal),
    cotizacion: txt(row.cotizacion),
    costoArs: txt(row.costoArs),
    pasEnvio: txt(row.pasEnvio),
    valorPublico: txt(row.valorPublico),
    stock,
  };
}

const inputCls = "w-full border border-black/10 bg-white px-3 py-2 text-sm";
const labelCls =
  "block text-[10px] font-semibold tracking-[0.12em] text-soft uppercase";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

export default function GestionCostosPage() {
  const { ready, data, saveCosto, deleteCosto, restoreExcelCostos } = useBusiness();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<FormState | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data.costos;
    return data.costos.filter(
      (c) =>
        c.modelo.toLowerCase().includes(term) ||
        c.marca.toLowerCase().includes(term) ||
        (c.sku ?? "").toLowerCase().includes(term) ||
        (c.grada ?? "").toLowerCase().includes(term) ||
        (c.calidad ?? "").toLowerCase().includes(term)
    );
  }, [data.costos, q]);

  const avgMargin = useMemo(() => {
    const withVals = rows.filter((r) => r.valorPublico && r.costoFinal);
    if (!withVals.length) return 0;
    return (
      withVals.reduce(
        (s, r) => s + ((r.valorPublico ?? 0) - (r.costoFinal ?? 0)),
        0
      ) / withVals.length
    );
  }, [rows]);

  /** Mismas fórmulas del Excel: ARS = costo × cotización, final = ARS + pas/envío. */
  const calc = useMemo(() => {
    if (!form) return null;
    const real = toNum(form.costoReal);
    const cot = toNum(form.cotizacion);
    const auto = real != null && cot != null ? real * cot : null;
    const costoArs = toNum(form.costoArs) ?? auto;
    const pasEnvio = toNum(form.pasEnvio);
    const costoFinal =
      costoArs == null && pasEnvio == null ? null : (costoArs ?? 0) + (pasEnvio ?? 0);
    const valorPublico = toNum(form.valorPublico);
    const ganancia =
      valorPublico == null || costoFinal == null ? null : valorPublico - costoFinal;
    return { auto, costoArs, pasEnvio, costoFinal, valorPublico, ganancia };
  }, [form]);

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  const setField = (key: keyof FormState, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const submit = () => {
    if (!form || !calc) return;
    if (!form.marca.trim() && !form.modelo.trim()) {
      window.alert("Marca o modelo son obligatorios.");
      return;
    }
    const stock: Record<string, number> = {};
    for (const [size, value] of Object.entries(form.stock)) {
      const qty = toNum(value);
      if (qty != null && qty !== 0) stock[size] = qty;
    }
    const costoRealNum = toNum(form.costoReal);
    const row: CostoRow = {
      id: form.id ?? uid("cos"),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      sku: form.sku.trim() || null,
      color: null,
      grada: form.grada.trim() || null,
      calidad: form.calidad.trim() || null,
      cantidadXCaja: toNum(form.cantidadXCaja),
      // El Excel admite texto acá (ej. "promo 70"), así que se respeta tal cual.
      costoReal: costoRealNum ?? (form.costoReal.trim() || null),
      cotizacion: toNum(form.cotizacion),
      costoArs: calc.costoArs,
      pasEnvio: calc.pasEnvio,
      costoFinal: calc.costoFinal,
      valorPublico: calc.valorPublico,
      ganancia: calc.ganancia,
      stock,
    };
    saveCosto(row);
    setForm(null);
  };

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Costos"
        description={`Hoja COSTOS del Excel · ${data.costos.length} filas · mismas columnas: Marca, Modelo, Código SKU, Grada, Calidad, Cant. x caja, costos y talles`}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    "Esto reemplaza la hoja COSTOS por la original de Rastro - General.xlsx. ¿Seguimos?"
                  )
                ) {
                  return;
                }
                restoreExcelCostos();
                setForm(null);
              }}
              className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
            >
              Restaurar Excel
            </button>
            <button
              type="button"
              onClick={() => setForm(form ? null : { ...EMPTY_FORM, stock: {} })}
              className="btn-press bg-brand px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              {form ? "Cerrar" : "Nuevo modelo"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5">
        <AdminStat label="Modelos" value={String(rows.length)} />
        <AdminStat label="Ganancia prom." value={formatMoney(avgMargin)} />
      </div>

      {form && calc ? (
        <section className="border border-black/5 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {form.id ? "Editar modelo" : "Nuevo modelo"}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Marca"
              value={form.marca}
              onChange={(v) => setField("marca", v)}
              placeholder="ADIDAS"
            />
            <Field
              label="Modelo"
              value={form.modelo}
              onChange={(v) => setField("modelo", v)}
              placeholder="SAMBA NEGRA"
            />
            <Field
              label="Código SKU"
              value={form.sku}
              onChange={(v) => setField("sku", v)}
              placeholder="NIK-AF1-GRI"
            />
            <Field
              label="Grada"
              value={form.grada}
              onChange={(v) => setField("grada", v)}
            />
            <Field
              label="Calidad"
              value={form.calidad}
              onChange={(v) => setField("calidad", v)}
            />
            <Field
              label="Cant. x caja"
              value={form.cantidadXCaja}
              onChange={(v) => setField("cantidadXCaja", v)}
              type="number"
            />
            <Field
              label="Costo $ real"
              value={form.costoReal}
              onChange={(v) => setField("costoReal", v)}
              placeholder="67"
            />
            <Field
              label="Cotización"
              value={form.cotizacion}
              onChange={(v) => setField("cotizacion", v)}
              placeholder="1200"
              type="number"
            />
            <Field
              label="Costo $ ARS"
              value={form.costoArs}
              onChange={(v) => setField("costoArs", v)}
              placeholder={
                calc.auto != null ? String(Math.round(calc.auto)) : "80400"
              }
              type="number"
            />
            <Field
              label="Pas / envío"
              value={form.pasEnvio}
              onChange={(v) => setField("pasEnvio", v)}
              placeholder="2991"
              type="number"
            />
            <Field
              label="Valor público"
              value={form.valorPublico}
              onChange={(v) => setField("valorPublico", v)}
              placeholder="120000"
              type="number"
            />
          </div>

          <div className="mt-4">
            <p className={labelCls}>Stock por talle</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SHEET_SIZES.map((size) => (
                <label key={size} className="w-16">
                  <span className="block text-center text-[10px] text-soft">
                    {size}
                  </span>
                  <input
                    type="number"
                    value={form.stock[size] ?? ""}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              stock: { ...prev.stock, [size]: e.target.value },
                            }
                          : prev
                      )
                    }
                    className="w-full border border-black/10 bg-white px-2 py-1.5 text-center text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <AdminStat
              label="Costo $ ARS"
              value={moneyOrDash(calc.costoArs, formatMoney)}
            />
            <AdminStat
              label="Costo final"
              value={moneyOrDash(calc.costoFinal, formatMoney)}
            />
            <AdminStat
              label="Valor público"
              value={moneyOrDash(calc.valorPublico, formatMoney)}
            />
            <AdminStat
              label="Ganancia"
              value={moneyOrDash(calc.ganancia, formatMoney)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submit}
              className="btn-press bg-brand px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar marca, modelo, SKU, grada, calidad…"
        className="w-full max-w-md border border-black/10 bg-white px-3 py-2.5 text-sm"
      />

      <AdminTableShell title="COSTOS · mismas columnas que el Excel">
        <table className="min-w-max">
          <thead className="bg-[#f5f4f0]">
            <tr>
              <th className={adminTh}>Marca</th>
              <th className={adminTh}>Modelo</th>
              <th className={adminTh}>Código SKU</th>
              <th className={adminTh}>Grada</th>
              <th className={adminTh}>Calidad</th>
              <th className={adminTh}>Cantidad x caja</th>
              <th className={adminTh}>Costo en $ real</th>
              <th className={adminTh}>Cotización real</th>
              <th className={adminTh}>Costo $ ARS</th>
              <th className={adminTh}>% Pas/Envío</th>
              <th className={adminTh}>Costo final</th>
              <th className={adminTh}>Valor público</th>
              <th className={adminTh}>Ganancia</th>
              {SHEET_SIZES.map((s) => (
                <th key={s} className={adminTh}>
                  {s}
                </th>
              ))}
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className={`${adminTd} text-soft`}
                  colSpan={14 + SHEET_SIZES.length}
                >
                  Todavía no hay modelos. Usá “Restaurar Excel” para cargar la
                  hoja COSTOS original, o “Nuevo modelo”.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td className={adminTd}>{cell(c.marca)}</td>
                  <td className={`${adminTdWrap} min-w-[160px]`}>
                    {cell(c.modelo)}
                  </td>
                  <td className={adminTd}>{cell(c.sku)}</td>
                  <td className={adminTd}>{cell(c.grada)}</td>
                  <td className={adminTd}>{cell(c.calidad)}</td>
                  <td className={adminTd}>{cell(c.cantidadXCaja)}</td>
                  <td className={adminTd}>{cell(c.costoReal)}</td>
                  <td className={adminTd}>{cell(c.cotizacion)}</td>
                  <td className={adminTd}>
                    {moneyOrDash(c.costoArs, formatMoney)}
                  </td>
                  <td className={adminTd}>
                    {moneyOrDash(c.pasEnvio, formatMoney)}
                  </td>
                  <td className={adminTd}>
                    {moneyOrDash(c.costoFinal, formatMoney)}
                  </td>
                  <td className={adminTd}>
                    {moneyOrDash(c.valorPublico, formatMoney)}
                  </td>
                  <td className={adminTd}>
                    {moneyOrDash(c.ganancia, formatMoney)}
                  </td>
                  {SHEET_SIZES.map((s) => (
                    <td key={s} className={adminTd}>
                      {c.stock[s] ?? ""}
                    </td>
                  ))}
                  <td className={adminTd}>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setForm(formFromRow(c));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-[11px] font-semibold uppercase underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCosto(c.id)}
                        className="text-[11px] font-semibold uppercase text-soft underline"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
