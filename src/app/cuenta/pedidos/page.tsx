"use client";

import { useState } from "react";
import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";
import { AccountGate } from "@/components/account/AccountGate";
import { CancelOrderDialog } from "@/components/account/CancelOrderDialog";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import {
  canCancelUnpaidOrder,
  canRetryMercadoPago,
  mercadoPagoCheckoutHref,
  paymentMethodLabel,
} from "@/lib/mock/orderLabels";
import type { MockOrder } from "@/lib/mock/types";

function orderActionLabel(order: MockOrder) {
  if (canRetryMercadoPago(order)) return "Ir a pagar";
  if (order.status === "pendiente" && order.paymentMethod === "transferencia") {
    return "Ver datos";
  }
  return "Ver";
}

function orderActionHref(order: MockOrder) {
  if (canRetryMercadoPago(order)) return mercadoPagoCheckoutHref(order);
  return `/cuenta/pedidos/${order.id}`;
}

function statusClass(status: string) {
  if (status === "pagado" || status === "entregado") {
    return "bg-[#f0fdf4] text-[#15803d]";
  }
  if (status === "cancelado") return "bg-[#fef2f2] text-[#b91c1c]";
  if (status === "pendiente") return "bg-[#fefce8] text-[#a16207]";
  return "bg-[#f5f4f0] text-[#222222]";
}

function OrdersContent() {
  const { session, orders, cancelOrder } = useStore();
  const myOrders = orders.filter((o) => o.userId === session!.id);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [pendingCancel, setPendingCancel] = useState<MockOrder | null>(null);

  const openCancel = (order: MockOrder) => {
    if (!canCancelUnpaidOrder(order)) return;
    setError("");
    setPendingCancel(order);
  };

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    setBusyId(pendingCancel.id);
    setError("");
    const result = await cancelOrder(pendingCancel.id);
    setBusyId("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPendingCancel(null);
  };

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 pb-28 md:px-6 md:py-12 md:pb-14 lg:py-14">
      <Link
        href="/cuenta"
        className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
      >
        ← Mi cuenta
      </Link>
      <header className="mt-4 border-b border-black/5 pb-6 md:mt-6 md:pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Cuenta
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
          Mis pedidos
        </h1>
        <p className="mt-2 text-sm text-soft">
          {myOrders.length} pedido{myOrders.length === 1 ? "" : "s"}
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </header>

      {/* —— Desktop: tabla —— */}
      <div className="mt-8 hidden overflow-x-auto border border-black/5 bg-white lg:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-black/5 bg-[#f5f4f0] text-[10px] font-semibold tracking-[0.14em] uppercase">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {myOrders.map((o) => {
              const first = o.items[0];
              const extra = o.items.length - 1;
              return (
                <tr
                  key={o.id}
                  className="border-b border-black/5 align-middle last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <Link
                      href={`/cuenta/pedidos/${o.id}`}
                      className="font-display text-lg font-bold tracking-wide uppercase underline-offset-2 hover:underline"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-soft">
                    {new Date(o.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex max-w-[280px] items-center gap-3">
                      {first && (
                        <div className="relative size-12 shrink-0 bg-[#f5f4f0]">
                          <Image
                            src={first.image}
                            alt=""
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium uppercase">
                          {first?.productName || "—"}
                        </p>
                        <p className="truncate text-xs text-soft">
                          {first
                            ? `${first.variantName} · ${first.size}`
                            : ""}
                          {extra > 0 ? ` · +${extra}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {paymentMethodLabel(o.paymentMethod)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold">
                    {formatMoney(o.total)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ${statusClass(o.status)}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={orderActionHref(o)}
                        className={`btn-press inline-flex px-3 py-2 text-[10px] font-semibold tracking-[0.12em] uppercase ${
                          canRetryMercadoPago(o)
                            ? "bg-[#009ee3] text-white"
                            : "border border-[#222222]"
                        }`}
                      >
                        {orderActionLabel(o)}
                      </Link>
                      {canCancelUnpaidOrder(o) && (
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => openCancel(o)}
                          className="btn-press inline-flex border border-red-300 px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-red-700 uppercase disabled:opacity-50"
                        >
                          {busyId === o.id ? "…" : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {myOrders.length === 0 && (
          <p className="py-12 text-center text-sm text-soft">
            No hay pedidos.{" "}
            <Link href="/productos" className="underline">
              Ir al catálogo
            </Link>
          </p>
        )}
      </div>

      {/* —— Mobile / tablet: cards —— */}
      <div className="mt-6 space-y-4 lg:hidden">
        {myOrders.map((o) => (
          <article
            key={o.id}
            className="border border-black/5 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-xl font-bold tracking-wide uppercase">
                  {o.id}
                </p>
                <p className="mt-1 text-xs text-soft">
                  {new Date(o.createdAt).toLocaleDateString("es-AR")}
                  {" · "}
                  {paymentMethodLabel(o.paymentMethod)}
                </p>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ${statusClass(o.status)}`}
              >
                {o.status}
              </span>
            </div>

            <p className="mt-3 text-base font-semibold">
              {formatMoney(o.total)}
            </p>

            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {o.items.map((item) => (
                <div
                  key={item.id}
                  className="flex w-[72%] max-w-[260px] shrink-0 items-center gap-3 border border-black/5 bg-[#f5f4f0] p-2.5"
                >
                  <div className="relative size-14 shrink-0 bg-white">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium uppercase">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-soft">
                      {item.variantName} · {item.size} · x{item.qty}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={orderActionHref(o)}
                className={`btn-press flex w-full items-center justify-center px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase ${
                  canRetryMercadoPago(o)
                    ? "bg-[#009ee3] text-white"
                    : "bg-[#222222] text-white"
                }`}
              >
                {orderActionLabel(o) === "Ver"
                  ? "Ver seguimiento"
                  : orderActionLabel(o) === "Ver datos"
                    ? "Ver datos para transferir"
                    : orderActionLabel(o)}
              </Link>
              {canCancelUnpaidOrder(o) && (
                <button
                  type="button"
                  disabled={busyId === o.id}
                  onClick={() => openCancel(o)}
                  className="btn-press w-full border border-red-300 px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-red-700 uppercase disabled:opacity-50"
                >
                  {busyId === o.id ? "Cancelando…" : "Cancelar pedido"}
                </button>
              )}
            </div>
          </article>
        ))}
        {myOrders.length === 0 && (
          <p className="py-12 text-center text-sm text-soft">
            No hay pedidos.{" "}
            <Link href="/productos" className="underline">
              Ir al catálogo
            </Link>
          </p>
        )}
      </div>

      {pendingCancel && (
        <CancelOrderDialog
          order={pendingCancel}
          busy={busyId === pendingCancel.id}
          onClose={() => {
            if (busyId !== pendingCancel.id) setPendingCancel(null);
          }}
          onConfirm={confirmCancel}
        />
      )}
    </main>
  );
}

export default function AccountOrdersPage() {
  return (
    <ShopChrome>
      <AccountGate>
        <OrdersContent />
      </AccountGate>
    </ShopChrome>
  );
}
