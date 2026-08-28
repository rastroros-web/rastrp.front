"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { use, useEffect, useState, type FormEvent } from "react";
import { notFound } from "next/navigation";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney, parseMoney } from "@/lib/mock/money";
import {
  carrierLabel,
  trackingUrl,
} from "@/lib/mock/tracking";
import type { OrderStatus, TrackingCarrier } from "@/lib/mock/types";
import { FancySelect } from "@/components/ui/FancySelect";
import {
  orderStatusOptions,
  trackingCarrierOptions,
} from "@/lib/admin/select-options";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { orders, updateOrderStatus, updateOrderTracking, ready } = useStore();
  const order = orders.find((o) => o.id === id);

  const [carrier, setCarrier] = useState<TrackingCarrier>("andreani");
  const [code, setCode] = useState("");
  const [markEnviado, setMarkEnviado] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!order) return;
    setCarrier(order.trackingCarrier ?? "andreani");
    setCode(order.trackingCode ?? "");
  }, [order?.id, order?.trackingCarrier, order?.trackingCode]);

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;
  if (!order) notFound();

  const d = order.shippingDetails;
  const trackLink = trackingUrl(order.trackingCarrier, order.trackingCode);
  const itemsQty = order.items.reduce((s, i) => s + i.qty, 0);

  const saveTracking = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    updateOrderTracking(order.id, {
      trackingCarrier: carrier,
      trackingCode: code,
      status: markEnviado ? "enviado" : undefined,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/pedidos"
            className="text-[11px] font-semibold uppercase underline"
          >
            ← Pedidos
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            {order.id}
          </h1>
          <p className="mt-1 text-sm text-soft">
            Creado {new Date(order.createdAt).toLocaleString("es-AR")}
            {" · "}
            Actualizado {new Date(order.updatedAt).toLocaleString("es-AR")}
          </p>
        </div>
        <div className="w-full sm:w-48">
          <FancySelect
            label="Estado"
            value={order.status}
            options={orderStatusOptions}
            onChange={(value) =>
              updateOrderStatus(order.id, value as OrderStatus)
            }
          />
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="border border-black/5 bg-white p-4">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Total
          </p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(order.total)}</p>
        </div>
        <div className="border border-black/5 bg-white p-4">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Items
          </p>
          <p className="mt-1 text-lg font-semibold">{itemsQty}</p>
        </div>
        <div className="border border-black/5 bg-white p-4">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Pago
          </p>
          <p className="mt-1 text-sm font-semibold capitalize">
            {order.paymentMethod}
          </p>
        </div>
        <div className="border border-black/5 bg-white p-4">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Carrier
          </p>
          <p className="mt-1 text-sm font-semibold">
            {carrierLabel(order.trackingCarrier)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cliente */}
        <section className="border border-black/5 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Cliente
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-soft">Nombre</dt>
              <dd className="text-right font-medium">{order.userName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-soft">Email</dt>
              <dd className="text-right break-all">{order.userEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-soft">User ID</dt>
              <dd className="font-mono text-xs text-soft">{order.userId}</dd>
            </div>
            {d?.phone && (
              <div className="flex justify-between gap-4">
                <dt className="text-soft">Teléfono</dt>
                <dd>{d.phone}</dd>
              </div>
            )}
            {d?.dni && (
              <div className="flex justify-between gap-4">
                <dt className="text-soft">DNI</dt>
                <dd>{d.dni}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Entrega */}
        <section className="border border-black/5 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Entrega
          </h2>
          {d ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-soft">Destinatario</dt>
                <dd className="text-right font-medium">{d.fullName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-soft">Zona</dt>
                <dd className="capitalize">
                  {d.zone === "rosario" ? "Rosario / alrededores" : "Interior"}
                </dd>
              </div>
              <div>
                <dt className="text-soft">Dirección</dt>
                <dd className="mt-1">
                  {d.street} {d.number}
                  {d.floor ? `, ${d.floor}` : ""}
                  <br />
                  {d.city}, {d.province} ({d.postalCode})
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-soft">Email envío</dt>
                <dd className="break-all text-right">{d.email}</dd>
              </div>
              {d.sameDayEligible && (
                <p className="pt-1 text-xs font-semibold text-[#16a34a]">
                  Elegible envío en el día
                </p>
              )}
              {d.notes && (
                <div>
                  <dt className="text-soft">Notas</dt>
                  <dd className="mt-1">{d.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-soft">{order.shippingAddress}</p>
          )}
          <p className="mt-4 border-t border-black/5 pt-3 text-xs text-soft">
            Resumen: {order.shippingAddress}
          </p>
        </section>
      </div>

      {/* Tracking form */}
      <section className="border border-black/5 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Código de tracking
            </h2>
            <p className="mt-1 text-xs text-soft">
              Cargá el número de Andreani o Correo Argentino para que el cliente
              lo vea en su cuenta.
            </p>
          </div>
          {order.trackingCode && (
            <div className="text-right text-sm">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase">
                Actual
              </p>
              <p className="font-semibold">
                {carrierLabel(order.trackingCarrier)}
              </p>
              <p className="font-mono text-xs">{order.trackingCode}</p>
              {trackLink && (
                <a
                  href={trackLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-[11px] font-semibold uppercase underline"
                >
                  Abrir seguimiento
                </a>
              )}
            </div>
          )}
        </div>

        <form onSubmit={saveTracking} className="mt-5 grid gap-3 sm:grid-cols-2">
          <FancySelect
            label="Transportista"
            value={carrier}
            options={trackingCarrierOptions}
            onChange={(value) => setCarrier(value as TrackingCarrier)}
          />
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Número de seguimiento
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={
                carrier === "andreani"
                  ? "Ej: 360000012345678"
                  : carrier === "correo_argentino"
                    ? "Ej: RA123456789AR"
                    : "Código de seguimiento"
              }
              className="w-full border border-black/10 bg-white px-3 py-2.5 font-mono text-sm outline-none"
              required
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={markEnviado}
              onChange={(e) => setMarkEnviado(e.target.checked)}
              className="size-4 accent-[#222222]"
            />
            Marcar pedido como <strong className="font-semibold">enviado</strong>{" "}
            al guardar
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="btn-press bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Guardar tracking
            </button>
            {saved && (
              <span className="text-sm font-medium text-[#16a34a]">
                Guardado ✓
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Items */}
      <section className="border border-black/5 bg-white">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Productos ({itemsQty})
          </h2>
        </div>
        {order.items.map((item) => {
          const line = parseMoney(item.price) * item.qty;
          const lineTransfer = parseMoney(item.transfer) * item.qty;
          return (
            <div
              key={item.id}
              className="flex gap-4 border-b border-black/5 p-4 last:border-0 sm:p-5"
            >
              <div className="relative size-16 shrink-0 bg-[#f5f4f0] sm:size-20">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase">
                  {item.brand}
                </p>
                <p className="font-medium uppercase">{item.productName}</p>
                <p className="mt-1 text-xs text-soft">
                  {item.variantName} · talle {item.size} · cantidad {item.qty}
                </p>
                <p className="mt-1 font-mono text-[10px] text-soft">
                  {item.productSlug} / {item.variantId}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className="font-medium">{formatMoney(line)}</p>
                <p className="text-xs text-[#16a34a]">
                  {formatMoney(lineTransfer)} transf.
                </p>
                <p className="mt-1 text-xs text-soft">
                  {item.price} × {item.qty}
                </p>
              </div>
            </div>
          );
        })}

        <div className="space-y-1.5 border-t border-black/5 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-soft">Subtotal lista</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-soft">Total transferencia (25% OFF)</span>
            <span>{formatMoney(order.transferTotal)}</span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-[#16a34a]">
              <span>
                Descuento cupón
                {order.promoCode ? ` (${order.promoCode})` : ""}
              </span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
          )}
          {order.promoCode && (order.discount ?? 0) === 0 && (
            <div className="flex justify-between text-[#16a34a]">
              <span>Cupón</span>
              <span>{order.promoCode}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-soft">Costo de envío</span>
            <span>
              {(order.shipping ?? 0) === 0
                ? "Gratis"
                : formatMoney(order.shipping ?? 0)}
            </span>
          </div>
          <div className="flex justify-between border-t border-black/5 pt-3 text-base font-semibold">
            <span>Total cobrado</span>
            <span>{formatMoney(order.total)}</span>
          </div>
          <p className="pt-1 text-xs text-soft">
            Método de pago:{" "}
            <span className="capitalize text-[#222222]">
              {order.paymentMethod}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
