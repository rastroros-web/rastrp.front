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
import { formatMoney, parseMoney } from "@/lib/mock/money";
import { sumField, type VentaRow } from "@/lib/mock/business";
import { resolveVentaArticulo } from "@/lib/mock/resolveVenta";
import { itemLabel, ledgerFecha } from "@/lib/mock/orderLabels";
import { sizeQty } from "@/lib/mock/stock";
import { FancySelect } from "@/components/ui/FancySelect";
import { isoToArgentinaParts } from "@/lib/argentinaTime";
import type { ShopProduct } from "@/lib/mock/types";
import type { ColorVariant } from "@/data/catalog";
import {
  backfillTalleFromOrders,
  refreshBusinessFromServer,
  syncShopOrdersToVentas,
} from "@/lib/mock/orderVentas";
import { getBackendUrl } from "@/lib/api/backend";

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

type Periodo = "todas" | "custom";

const MEDIOS = [
  { value: "Transferencia", label: "Transferencia" },
  { value: "Mercado Pago", label: "Mercado Pago" },
];

function todayArgentina() {
  return isoToArgentinaParts(new Date().toISOString()).date;
}

function firstSize(variant: ColorVariant | undefined): string {
  if (!variant?.sizes.length) return "";
  const withStock = variant.sizes.find((s) => sizeQty(s) > 0);
  return (withStock ?? variant.sizes[0]).label;
}

export default function GestionVentasPage() {
  const { ready, data, addVenta, deleteVenta, fillVentaCosts } = useBusiness();
  const { applyVentasToStock, getProduct, orders, products } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pickedSlug, setPickedSlug] = useState("");
  const [pickedVariant, setPickedVariant] = useState("");
  const [pickedTalle, setPickedTalle] = useState("");
  const [medioPago, setMedioPago] = useState(MEDIOS[0].value);
  const [cantidad, setCantidad] = useState(1);
  const [totalInput, setTotalInput] = useState("");
  const [costoInput, setCostoInput] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("todas");
  const [year, setYear] = useState<string>("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const importedOnce = useRef(false);
  const costsFilledOnce = useRef(false);
  const hasApi = Boolean(getBackendUrl());

  // Sin API: importa pedidos mock a la planilla local una vez.
  // Con API: las ventas las anota el backend al marcar el pedido como pagado.
  useEffect(() => {
    if (!ready || importedOnce.current || hasApi || !orders.length) return;
    importedOnce.current = true;
    const talles = backfillTalleFromOrders(orders);
    const result = syncShopOrdersToVentas(orders);
    const parts: string[] = [];
    if (result.added > 0) {
      parts.push(`${result.added} ítems nuevos desde la tienda`);
    }
    if (talles > 0) parts.push(`${talles} talles completados`);
    if (parts.length) setToast(`Se sumaron: ${parts.join(" · ")}`);
  }, [ready, orders, hasApi]);

  useEffect(() => {
    if (!ready || costsFilledOnce.current || !data.ventas.length) return;
    costsFilledOnce.current = true;
    fillVentaCosts();
  }, [ready, data.ventas.length, fillVentaCosts]);

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
      const resolved = resolveVentaArticulo(
        v.articulo,
        data.costos,
        data.ecommerce
      );
      const link = v.productSlug
        ? {
            ...resolved,
            slug: v.productSlug,
            variantId: v.variantId ?? resolved.variantId,
            matched: true,
            label: v.articulo,
          }
        : resolved;
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

  const catalog = useMemo(
    () =>
      [...products]
        .filter((p) => p.variants.length > 0)
        .sort(
          (a, b) =>
            a.brand.localeCompare(b.brand, "es") ||
            a.name.localeCompare(b.name, "es")
        ),
    [products]
  );
  const selectedProduct = catalog.find((p) => p.slug === pickedSlug);
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === pickedVariant
  );

  function fillMoney(
    product: ShopProduct | undefined,
    variant: ColorVariant | undefined,
    qty: number,
    medio: string
  ) {
    if (!variant) {
      setTotalInput("");
      setCostoInput("");
      return;
    }
    const unit = /transfer/i.test(medio)
      ? parseMoney(variant.transfer)
      : parseMoney(variant.price);
    const articulo = product
      ? itemLabel({
          brand: product.brand,
          productName: product.name,
          variantName: variant.name,
        })
      : "";
    const link = resolveVentaArticulo(articulo, data.costos, data.ecommerce);
    setTotalInput(String(Math.round(unit * Math.max(1, qty))));
    setCostoInput(
      link.costoUnit != null
        ? String(Math.round(link.costoUnit * Math.max(1, qty)))
        : ""
    );
  }

  function pickProduct(slug: string) {
    setPickedSlug(slug);
    const product = catalog.find((p) => p.slug === slug);
    const variant = product?.variants[0];
    setPickedVariant(variant?.id ?? "");
    setPickedTalle(firstSize(variant));
    fillMoney(product, variant, cantidad, medioPago);
  }

  function pickVariant(id: string) {
    setPickedVariant(id);
    const variant = selectedProduct?.variants.find((v) => v.id === id);
    setPickedTalle(firstSize(variant));
    fillMoney(selectedProduct, variant, cantidad, medioPago);
  }

  function resetForm() {
    setPickedSlug("");
    setPickedVariant("");
    setPickedTalle("");
    setMedioPago(MEDIOS[0].value);
    setCantidad(1);
    setTotalInput("");
    setCostoInput("");
  }

  const total = sumField(enrichedRows, (v) => v.total);
  const costo = sumField(enrichedRows, (v) => v.displayCosto);
  const linked = enrichedRows.filter((v) => v.link.matched).length;

  function selectPeriodo(next: Periodo) {
    setPeriodo(next);
    if (next === "todas") {
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

  function onImportOrders() {
    if (hasApi) {
      refreshBusinessFromServer();
      setToast(
        "Planilla actualizada desde el servidor. Las ventas de tienda se anotan al marcar el pedido como pagado."
      );
      return;
    }
    const result = syncShopOrdersToVentas(orders);
    setToast(
      result.added
        ? `Importados ${result.added} ítems desde pedidos de la tienda`
        : "No hay pedidos nuevos para importar"
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProduct || !selectedVariant) {
      setToast("Elegí un producto del catálogo.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const qty = Math.max(1, Number(fd.get("cantidad") || cantidad || 1));
    const t = Number(fd.get("total") || totalInput || 0);
    let c = Number(fd.get("costo") || costoInput || 0);
    const articulo = itemLabel({
      brand: selectedProduct.brand,
      productName: selectedProduct.name,
      variantName: selectedVariant.name,
    });
    const talle = pickedTalle.trim() || null;
    const link = resolveVentaArticulo(articulo, data.costos, data.ecommerce);
    if (!c && link.costoUnit != null) c = link.costoUnit * qty;
    const venta = {
      fecha: String(fd.get("fecha") || todayArgentina()),
      articulo,
      talle,
      cantidad: qty,
      total: t,
      costo: c,
      ganancia: t - c,
      cliente: String(fd.get("cliente") || "") || null,
      medioPago: String(fd.get("medioPago") || medioPago) || null,
      productSlug: selectedProduct.slug,
      variantId: selectedVariant.id,
    };
    addVenta(venta);
    resetForm();
    setOpen(false);

    const stock = await applyVentasToStock([{ ...venta, id: "venta-nueva" }]);
    if (stock.error) {
      setToast(`Venta anotada. Stock: ${stock.error}`);
      return;
    }
    if (stock.applied > 0) {
      setToast(
        `Venta anotada · stock −${stock.applied} u.` +
          (stock.skipped ? ` · ${stock.skipped} sin stock suficiente` : "")
      );
      return;
    }
    setToast("Venta anotada. No había stock para descontar en ese talle.");
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  const desc =
    desde || hasta || year !== "all"
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
              {hasApi ? "Actualizar planilla" : "Importar pedidos tienda"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen((v) => {
                  const next = !v;
                  if (!next) resetForm();
                  return next;
                });
              }}
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
                year === "all"
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
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Fecha
            </span>
            <input
              name="fecha"
              type="date"
              defaultValue={todayArgentina()}
              required
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <FancySelect
            label="Artículo"
            value={pickedSlug}
            placeholder="Elegí un producto"
            options={catalog.map((p) => ({
              value: p.slug,
              label: `${p.brand} ${p.name}`,
            }))}
            onChange={pickProduct}
            variant="field"
          />
          <FancySelect
            label="Color"
            value={pickedVariant}
            placeholder="Color"
            options={(selectedProduct?.variants || []).map((v) => ({
              value: v.id,
              label: v.name,
            }))}
            onChange={pickVariant}
            variant="field"
          />
          <FancySelect
            label="Talle"
            value={pickedTalle}
            placeholder="Talle"
            options={(selectedVariant?.sizes || []).map((s) => ({
              value: s.label,
              label:
                sizeQty(s) > 0 ? `${s.label} · ${sizeQty(s)} u.` : `${s.label} · sin stock`,
            }))}
            onChange={setPickedTalle}
            variant="field"
          />
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Cliente
            </span>
            <input
              name="cliente"
              placeholder="Nombre"
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <FancySelect
            label="Medio de pago"
            value={medioPago}
            options={MEDIOS}
            onChange={(value) => {
              setMedioPago(value);
              fillMoney(selectedProduct, selectedVariant, cantidad, value);
            }}
            variant="field"
          />
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Cantidad
            </span>
            <input
              name="cantidad"
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => {
                const qty = Math.max(1, Number(e.target.value) || 1);
                setCantidad(qty);
                fillMoney(selectedProduct, selectedVariant, qty, medioPago);
              }}
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Total $
            </span>
            <input
              name="total"
              type="number"
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              required
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Costo $
            </span>
            <input
              name="costo"
              type="number"
              value={costoInput}
              onChange={(e) => setCostoInput(e.target.value)}
              placeholder="Se completa si hay costo del modelo"
              className="w-full border border-black/10 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={!pickedSlug || !pickedVariant}
            className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase disabled:opacity-40 sm:col-span-2 lg:col-span-4"
          >
            Guardar
          </button>
        </form>
      )}

      <AdminTableShell
        title="Historial"
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
