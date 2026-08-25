"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useBusiness } from "@/components/admin/BusinessProvider";
import { useStore } from "@/components/store/StoreProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney } from "@/lib/mock/money";
import { sumField, type VentaRow } from "@/lib/mock/business";
import { resolveVentaArticulo } from "@/lib/mock/resolveVenta";
import { ledgerFecha } from "@/lib/mock/orderLabels";
import {
  backfillTalleFromOrders,
  syncShopOrdersToVentas,
} from "@/lib/mock/orderVentas";

/** Cuenta nueva ordenada del Excel (fila “A PARTIR DEL 1 DE JUNIO”) */
const CUENTA_NUEVA_DESDE = "2026-06-01";

function normalizeFecha(fecha: string | null): string | null {
  if (!fecha) return null;
  if (fecha.startsWith("2006-06-")) return `2026-06-${fecha.slice(8)}`;
  const iso = ledgerFecha(fecha);
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function sortVentasNewest(a: VentaRow, b: VentaRow) {
  const fa = normalizeFecha(a.fecha) ?? "";
  const fb = normalizeFecha(b.fecha) ?? "";
  if (fa === fb) return 0;
  if (!fa) return 1;
  if (!fb) return -1;
  return fa < fb ? 1 : -1;
}

type Periodo = "nueva" | "todas" | "custom";

export default function GestionVentasPage() {
  const { ready, data, addVenta, deleteVenta, fillVentaCosts } = useBusiness();
  const { applyVentasToStock, getProduct, orders } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>("nueva");
  const [year, setYear] = useState<string>("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const importedOnce = useRef(false);

  // Trae pedidos de checkout que aún no están en la planilla + talles faltantes
  useEffect(() => {
    if (!ready || importedOnce.current || !orders.length) return;
    importedOnce.current = true;
    const talles = backfillTalleFromOrders(orders);
    const result = syncShopOrdersToVentas(orders);
    const parts: string[] = [];
    if (result.added > 0) {
      parts.push(`${result.added} ítems nuevos desde la tienda`);
    }
    if (talles > 0) parts.push(`${talles} talles completados`);
    if (parts.length) setToast(`Se sumaron: ${parts.join(" · ")}`);
  }, [ready, orders]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const v of data.ventas) {
      const f = normalizeFecha(v.fecha);
      if (f) set.add(f.slice(0, 4));
    }
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [data.ventas]);

  const rows = useMemo(() => {
    let list = data.ventas.map((v) => ({
      ...v,
      fecha: normalizeFecha(v.fecha),
    }));

    if (periodo === "nueva") {
      list = list.filter((v) => v.fecha && v.fecha >= CUENTA_NUEVA_DESDE);
    }

    if (year !== "all") {
      list = list.filter((v) => v.fecha?.startsWith(year));
    }

    if (desde) list = list.filter((v) => v.fecha && v.fecha >= desde);
    if (hasta) list = list.filter((v) => v.fecha && v.fecha <= hasta);

    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (v) =>
          v.articulo.toLowerCase().includes(term) ||
          (v.cliente ?? "").toLowerCase().includes(term) ||
          (v.medioPago ?? "").toLowerCase().includes(term) ||
          (v.talle ?? "").includes(term) ||
          (v.orderId ?? "").toLowerCase().includes(term)
      );
    }

    return [...list].sort(sortVentasNewest);
  }, [data.ventas, q, periodo, year, desde, hasta]);

  const enrichedRows = useMemo(() => {
    return rows.map((v) => {
      const link = resolveVentaArticulo(
        v.articulo,
        data.costos,
        data.ecommerce
      );
      const costo =
        v.costo > 0
          ? v.costo
          : link.costoUnit != null
            ? link.costoUnit * (v.cantidad || 1)
            : 0;
      const product = link.slug ? getProduct(link.slug) : undefined;
      return {
        ...v,
        link,
        displayCosto: costo,
        displayGanancia: v.total - costo,
        productName: product
          ? `${product.brand} ${product.name}`
          : link.label,
      };
    });
  }, [rows, data.costos, data.ecommerce, getProduct]);

  const total = sumField(enrichedRows, (v) => v.total);
  const costo = sumField(enrichedRows, (v) => v.displayCosto);
  const linked = enrichedRows.filter((v) => v.link.matched).length;
  const cuentaNuevaCount = data.ventas.filter((v) => {
    const f = normalizeFecha(v.fecha);
    return f && f >= CUENTA_NUEVA_DESDE;
  }).length;

  function selectPeriodo(next: Periodo) {
    setPeriodo(next);
    if (next === "nueva") {
      setYear("all");
      setDesde("");
      setHasta("");
    }
  }

  function selectYear(y: string) {
    setYear(y);
    setPeriodo("custom");
    if (y === "all") {
      setDesde("");
      setHasta("");
      return;
    }
    setDesde(`${y}-01-01`);
    setHasta(`${y}-12-31`);
  }

  function onDateChange(which: "desde" | "hasta", value: string) {
    setPeriodo("custom");
    if (which === "desde") setDesde(value);
    else setHasta(value);
    if (year !== "all") setYear("all");
  }

  function clearDates() {
    setDesde("");
    setHasta("");
    setYear("all");
    setPeriodo("todas");
  }

  function onFillCosts() {
    const n = fillVentaCosts();
    setToast(
      n
        ? `Completados ${n} costos desde la planilla COSTOS`
        : "No había costos faltantes para completar"
    );
  }

  function onApplyStock() {
    const result = applyVentasToStock(rows);
    setToast(
      `Stock: −${result.applied} u. en catálogo` +
        (result.skipped ? ` · ${result.skipped} sin stock suficiente` : "")
    );
  }

  function onImportOrders() {
    const result = syncShopOrdersToVentas(orders);
    setToast(
      result.added
        ? `Importados ${result.added} ítems desde pedidos de la tienda`
        : "No hay pedidos nuevos para importar"
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const t = Number(fd.get("total") || 0);
    let c = Number(fd.get("costo") || 0);
    const articulo = String(fd.get("articulo") || "").trim();
    const cantidad = Number(fd.get("cantidad") || 1);
    if (!c) {
      const link = resolveVentaArticulo(articulo, data.costos, data.ecommerce);
      if (link.costoUnit != null) c = link.costoUnit * cantidad;
    }
    addVenta({
      fecha: String(fd.get("fecha") || new Date().toISOString().slice(0, 10)),
      articulo,
      talle: String(fd.get("talle") || "").trim() || null,
      cantidad,
      total: t,
      costo: c,
      ganancia: t - c,
      cliente: String(fd.get("cliente") || "") || null,
      medioPago: String(fd.get("medioPago") || "") || null,
    });
    e.currentTarget.reset();
    setOpen(false);
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  const desc =
    periodo === "nueva"
      ? `Cuenta nueva desde 1/6/26 · ${cuentaNuevaCount} en total · ${linked}/${enrichedRows.length} vinculadas al catálogo`
      : desde || hasta || year !== "all"
        ? `Filtro activo · ${enrichedRows.length} resultados · ${linked} vinculadas`
        : `${data.ventas.length} registros · planilla completa`;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Ventas"
        description={desc}
        actions={
          <>
            <button
              type="button"
              onClick={onImportOrders}
              className="btn-press bg-brand px-4 py-2.5 text-[11px] font-semibold text-white uppercase"
            >
              Importar pedidos tienda
            </button>
            <button
              type="button"
              onClick={onFillCosts}
              className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold uppercase"
            >
              Completar costos
            </button>
            <button
              type="button"
              onClick={onApplyStock}
              className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold uppercase"
            >
              Descontar stock
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              {open ? "Cerrar" : "Nueva venta"}
            </button>
          </>
        }
      />

      {toast && (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-black/5 bg-white px-4 py-3 text-sm">
          <p>{toast}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[11px] font-semibold uppercase underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="space-y-3 border border-black/5 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectPeriodo("nueva")}
            className={`px-3 py-2 text-[11px] font-semibold uppercase ${
              periodo === "nueva"
                ? "bg-[#222222] text-white"
                : "border border-black/10"
            }`}
          >
            Cuenta nueva (1/6/26)
          </button>
          <button
            type="button"
            onClick={() => selectPeriodo("todas")}
            className={`px-3 py-2 text-[11px] font-semibold uppercase ${
              periodo === "todas" && year === "all" && !desde && !hasta
                ? "bg-[#222222] text-white"
                : "border border-black/10"
            }`}
          >
            Todas ({data.ventas.length})
          </button>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Año
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectYear("all")}
              className={`px-3 py-2 text-[11px] font-semibold uppercase ${
                year === "all" && periodo !== "nueva"
                  ? "bg-[#222222] text-white"
                  : "border border-black/10"
              }`}
            >
              Todos
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => selectYear(y)}
                className={`px-3 py-2 text-[11px] font-semibold uppercase ${
                  year === y
                    ? "bg-[#222222] text-white"
                    : "border border-black/10"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Rango de fechas
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[11px] text-soft">
              Desde
              <input
                type="date"
                value={desde}
                onChange={(e) => onDateChange("desde", e.target.value)}
                className="mt-1 block border border-black/10 px-3 py-2 text-sm text-[#222222]"
              />
            </label>
            <label className="text-[11px] text-soft">
              Hasta
              <input
                type="date"
                value={hasta}
                onChange={(e) => onDateChange("hasta", e.target.value)}
                className="mt-1 block border border-black/10 px-3 py-2 text-sm text-[#222222]"
              />
            </label>
            {(desde || hasta || year !== "all") && (
              <button
                type="button"
                onClick={clearDates}
                className="border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar artículo, cliente, medio…"
          className="w-full max-w-md border border-black/10 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <AdminStat label="Total ventas" value={formatMoney(total)} />
        <AdminStat label="Costo" value={formatMoney(costo)} />
        <AdminStat label="Ganancia" value={formatMoney(total - costo)} />
        <AdminStat
          label="Vinculadas"
          value={`${linked}/${enrichedRows.length}`}
        />
      </div>

      {open && (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 border border-black/5 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input name="fecha" type="date" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="articulo" placeholder="Artículo (Adidas Samba chocolate)" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="talle" placeholder="Talle (ej. 38)" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="cliente" placeholder="Cliente" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="medioPago" placeholder="Medio de pago" className="border border-black/10 px-3 py-2 text-sm" />
          <input name="cantidad" type="number" min={1} defaultValue={1} className="border border-black/10 px-3 py-2 text-sm" />
          <input name="total" type="number" placeholder="Total $" className="border border-black/10 px-3 py-2 text-sm" required />
          <input name="costo" type="number" placeholder="Costo $ (auto si hay modelo/color)" className="border border-black/10 px-3 py-2 text-sm" />
          <button type="submit" className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase sm:col-span-2 lg:col-span-4">
            Guardar
          </button>
        </form>
      )}

      <AdminTableShell
        title="VENTAS · mismas columnas que el Excel (Fecha, Artículo, Cantidad, Total, Costo, Ganancia, Cliente, Medio de pago) + Talle de la tienda"
      >
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 bg-[#f5f4f0]">
            <tr>
              <th className={adminTh}>Fecha</th>
              <th className={adminTh}>Artículo</th>
              <th className={adminTh}>Talle</th>
              <th className={adminTh}>Cantidad</th>
              <th className={adminTh}>Total</th>
              <th className={adminTh}>Costo</th>
              <th className={adminTh}>Ganancia</th>
              <th className={adminTh}>Cliente</th>
              <th className={adminTh}>Medio de pago</th>
              <th className={adminTh} />
            </tr>
          </thead>
          <tbody>
            {enrichedRows.map((v) => (
              <tr key={v.id}>
                <td className={adminTd}>{v.fecha ?? "—"}</td>
                <td className={adminTd}>
                  <div className="max-w-[220px]">
                    {v.link.matched && v.link.slug ? (
                      <Link
                        href={`/admin/productos/${v.link.slug}/editar${
                          v.link.variantId
                            ? `?variant=${encodeURIComponent(v.link.variantId)}`
                            : ""
                        }`}
                        className="truncate font-medium underline"
                      >
                        {v.articulo}
                      </Link>
                    ) : (
                      <p className="truncate font-medium">{v.articulo}</p>
                    )}
                  </div>
                </td>
                <td className={adminTd}>
                  <span className="font-semibold">
                    {v.talle?.trim() ? v.talle : "—"}
                  </span>
                </td>
                <td className={adminTd}>{v.cantidad}</td>
                <td className={adminTd}>{formatMoney(v.total)}</td>
                <td className={adminTd}>
                  <span
                    className={
                      v.costo <= 0 && v.displayCosto > 0
                        ? "text-brand"
                        : undefined
                    }
                    title={
                      v.costo <= 0 && v.displayCosto > 0
                        ? "Costo estimado desde planilla COSTOS"
                        : undefined
                    }
                  >
                    {formatMoney(v.displayCosto)}
                  </span>
                </td>
                <td className={adminTd}>
                  {formatMoney(v.displayGanancia)}
                </td>
                <td className={adminTd}>{v.cliente ?? "—"}</td>
                <td className={adminTd}>{v.medioPago ?? "—"}</td>
                <td className={adminTd}>
                  <button
                    type="button"
                    onClick={() => deleteVenta(v.id)}
                    className="text-[11px] font-semibold uppercase text-soft underline"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {enrichedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-soft">
                  Sin ventas en este filtro. Probá cambiar año o fechas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
