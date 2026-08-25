"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBusiness } from "@/components/admin/BusinessProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney } from "@/lib/mock/money";
import { sumField } from "@/lib/mock/business";
import {
  availableMonths,
  datedGastos,
  datedVentas,
  monthLabel,
  monthlyBreakdown,
  porMedioDePago,
  saldosActuales,
  summarize,
  topModelos,
  valuarStock,
} from "@/lib/mock/businessStats";

const LINKS = [
  { href: "/admin/gestion/ventas", label: "Ventas", desc: "Historial de ventas y carga manual" },
  { href: "/admin/gestion/planilla", label: "Planilla diaria", desc: "Ingresos y egresos del día" },
  { href: "/admin/gestion/caja", label: "Caja", desc: "Efectivo y Personal Pay" },
  { href: "/admin/gestion/costos", label: "Costos", desc: "Costo final y margen por modelo" },
  { href: "/admin/gestion/ecommerce", label: "E-commerce", desc: "Catálogo web, color y stock" },
  { href: "/admin/gestion/talles", label: "Talles cm", desc: "Medidas por modelo" },
  { href: "/admin/gestion/gastos-fijos", label: "Gastos fijos", desc: "Marketing, ecommerce, TN" },
];

const ALL = "all";

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function GestionHubPage() {
  const { ready, data, clearBusiness } = useBusiness();
  const [period, setPeriod] = useState<string>(ALL);

  const months = useMemo(() => availableMonths(data), [data]);

  const view = useMemo(() => {
    const ventas = datedVentas(data.ventas || []);
    const gastos = datedGastos(data.gastos || []);
    const inPeriod = <T extends { monthKey: string | null }>(rows: T[]) =>
      period === ALL ? rows : rows.filter((r) => r.monthKey === period);

    const ventasPeriodo = inPeriod(ventas);
    const gastosPeriodo = sumField(inPeriod(gastos), (g) => g.pesos);

    return {
      resumen: summarize(ventasPeriodo, gastosPeriodo),
      meses: monthlyBreakdown(data),
      modelos: topModelos(ventasPeriodo),
      medios: porMedioDePago(ventasPeriodo),
      stock: valuarStock(data.ecommerce || [], data.costos || []),
      saldos: saldosActuales(data),
      fijos: sumField(data.gastosFijos || [], (g) => g.montoMensual),
      sinFecha: ventas.filter((v) => !v.monthKey).length,
      vacio:
        !ventas.length &&
        !gastos.length &&
        !(data.costos || []).length &&
        !(data.ecommerce || []).length,
    };
  }, [data, period]);

  if (!ready) {
    return <p className="text-sm text-soft">Cargando planilla…</p>;
  }

  const { resumen, meses, modelos, medios, stock, saldos } = view;
  const periodoLabel = period === ALL ? "todo el histórico" : monthLabel(period);

  return (
    <div className="space-y-6 md:space-y-8">
      <AdminSectionHeader
        title="Gestión"
        description="Mismas hojas que el Excel · se carga todo desde acá · las ventas de la tienda se agregan solas"
        actions={
          <>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="btn-press border border-[#222222] bg-white px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
              aria-label="Período"
            >
              <option value={ALL}>Todo el histórico</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <Link
              href="/admin/gestion/ecommerce"
              className="btn-press bg-brand px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Sync catálogo
            </Link>
            <button
              type="button"
              onClick={() => {
                const ok = window.confirm(
                  "Esto borra todas las hojas de gestión cargadas. ¿Seguís?"
                );
                if (ok) clearBusiness();
              }}
              className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
            >
              Vaciar planilla
            </button>
          </>
        }
      />

      {view.vacio ? (
        <section className="border border-brand/30 bg-brand/5 p-4 sm:p-5">
          <p className="text-sm font-semibold uppercase tracking-wide">
            Todavía no hay nada cargado
          </p>
          <p className="mt-1 text-sm text-soft">
            El libro arranca vacío y se completa desde acá. El orden que menos
            trabajo da es: primero <strong>Costos</strong> (marca, modelo y
            color; de ahí salen la ganancia y el margen), después{" "}
            <strong>E-commerce</strong> con el stock por talle, y por
            último los saldos de <strong>Caja</strong> y{" "}
            <strong>Planilla diaria</strong>. Las ventas de la tienda se anotan
            solas cuando entra un pedido.
          </p>
        </section>
      ) : null}

      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold tracking-[0.2em] text-soft uppercase">
          Resultado · {periodoLabel}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <AdminStat label="Ventas" value={formatMoney(resumen.ventas)} />
          <AdminStat label="Costo de lo vendido" value={formatMoney(resumen.costo)} />
          <AdminStat label="Ganancia bruta" value={formatMoney(resumen.ganancia)} />
          <AdminStat label="Margen" value={percent(resumen.margen)} />
          <AdminStat
            label="Egresos (compras y pagos)"
            value={formatMoney(resumen.gastos)}
          />
          <AdminStat
            label="Flujo (ventas − egresos)"
            value={formatMoney(resumen.flujo)}
          />
          <AdminStat label="Pares vendidos" value={String(resumen.unidades)} />
          <AdminStat label="Ticket promedio" value={formatMoney(resumen.ticket)} />
        </div>
        <div className="space-y-1">
          {resumen.sinCosto > 0 ? (
            <p className="text-xs text-soft">
              {resumen.sinCosto} venta{resumen.sinCosto === 1 ? "" : "s"} por{" "}
              {formatMoney(resumen.facturadoSinCosto)} están cargadas sin costo:
              hasta completarlas la ganancia y el margen se ven más altos de lo
              real.
            </p>
          ) : null}
          {view.sinFecha > 0 ? (
            <p className="text-xs text-soft">
              {view.sinFecha} venta{view.sinFecha === 1 ? "" : "s"} sin fecha:
              entran en el histórico pero no en los meses.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[11px] font-semibold tracking-[0.2em] text-soft uppercase">
          Plata disponible y stock
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <AdminStat label="Saldo bancario" value={formatMoney(saldos.bancario)} />
          <AdminStat label="Saldo efectivo" value={formatMoney(saldos.efectivo)} />
          <AdminStat label="Gastos fijos / mes" value={formatMoney(view.fijos)} />
          <AdminStat label="Última caja" value={formatMoney(data.caja[0]?.total ?? 0)} />
          <AdminStat label="Pares en stock" value={String(stock.pares)} />
          <AdminStat label="Variantes con stock" value={String(stock.variantes)} />
          <AdminStat label="Stock al costo" value={formatMoney(stock.valorCosto)} />
          <AdminStat
            label="Ganancia potencial del stock"
            value={formatMoney(stock.potencial)}
          />
        </div>
        {stock.sinCosto > 0 ? (
          <p className="text-xs text-soft">
            {stock.sinCosto} variante{stock.sinCosto === 1 ? "" : "s"} con stock sin
            costo cargado en la hoja Costos: el stock al costo queda por debajo
            del real.
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <AdminTableShell title="Mes a mes">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className={adminTh}>Mes</th>
                  <th className={adminTh}>Ventas</th>
                  <th className={adminTh}>Ganancia</th>
                  <th className={adminTh}>Margen</th>
                  <th className={adminTh}>Egresos</th>
                  <th className={adminTh}>Pares</th>
                </tr>
              </thead>
              <tbody>
                {meses.length === 0 ? (
                  <tr>
                    <td className={`${adminTd} text-soft`} colSpan={6}>
                      Todavía no hay movimientos con fecha.
                    </td>
                  </tr>
                ) : (
                  meses.map((m) => (
                    <tr key={m.monthKey}>
                      <td className={`${adminTd} capitalize`}>{m.label}</td>
                      <td className={adminTd}>{formatMoney(m.ventas)}</td>
                      <td className={adminTd}>{formatMoney(m.ganancia)}</td>
                      <td className={adminTd}>
                        {percent(m.margen)}
                        {m.sinCosto > 0 ? (
                          <span
                            className="ml-1 text-soft"
                            title={`${m.sinCosto} venta(s) sin costo cargado`}
                          >
                            *
                          </span>
                        ) : null}
                      </td>
                      <td className={adminTd}>{formatMoney(m.gastos)}</td>
                      <td className={adminTd}>{m.unidades}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminTableShell>
          {meses.some((m) => m.sinCosto > 0) ? (
            <p className="text-xs text-soft">
              * el mes tiene ventas sin costo cargado, así que el margen aparece
              más alto de lo real.
            </p>
          ) : null}
        </div>

        <AdminTableShell title="Modelos que más dejan">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr>
                <th className={adminTh}>Artículo</th>
                <th className={adminTh}>Pares</th>
                <th className={adminTh}>Ventas</th>
                <th className={adminTh}>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {modelos.length === 0 ? (
                <tr>
                  <td className={`${adminTd} text-soft`} colSpan={4}>
                    Sin ventas en {periodoLabel}.
                  </td>
                </tr>
              ) : (
                modelos.map((m) => (
                  <tr key={m.articulo}>
                    <td className={adminTd}>{m.articulo}</td>
                    <td className={adminTd}>{m.unidades}</td>
                    <td className={adminTd}>{formatMoney(m.ventas)}</td>
                    <td className={adminTd}>{formatMoney(m.ganancia)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTableShell>
      </div>

      <AdminTableShell title="Cómo pagan">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr>
              <th className={adminTh}>Medio de pago</th>
              <th className={adminTh}>Operaciones</th>
              <th className={adminTh}>Total</th>
              <th className={adminTh}>Participación</th>
            </tr>
          </thead>
          <tbody>
            {medios.length === 0 ? (
              <tr>
                <td className={`${adminTd} text-soft`} colSpan={4}>
                  Sin ventas en {periodoLabel}.
                </td>
              </tr>
            ) : (
              medios.map((m) => (
                <tr key={m.medio}>
                  <td className={adminTd}>{m.medio}</td>
                  <td className={adminTd}>{m.operaciones}</td>
                  <td className={adminTd}>{formatMoney(m.total)}</td>
                  <td className={adminTd}>
                    {resumen.ventas > 0
                      ? percent((m.total / resumen.ventas) * 100)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="border border-black/5 bg-white p-4 transition hover:border-brand/40 hover:bg-brand/5"
          >
            <p className="text-sm font-semibold uppercase tracking-wide">
              {l.label}
            </p>
            <p className="mt-1 text-sm text-soft">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
