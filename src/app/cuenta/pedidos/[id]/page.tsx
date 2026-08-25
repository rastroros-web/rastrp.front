"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShopChrome } from "@/components/ShopChrome";
import { AccountGate } from "@/components/account/AccountGate";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import { TransferAccountBox } from "@/components/checkout/TransferAccountBox";
import { carrierLabel, trackingUrl } from "@/lib/mock/tracking";
import type { OrderStatus } from "@/lib/mock/types";

const STEPS: OrderStatus[] = [
  "pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
];

function statusIndex(status: OrderStatus) {
  if (status === "cancelado") return -1;
  return STEPS.indexOf(status);
}

function isPostalShipment(order: {
  shippingDetails?: { zone?: string; shippingCarrier?: string };
  trackingCarrier?: string;
}) {
  const zone = String(order.shippingDetails?.zone || "").toLowerCase();
  if (zone === "rosario" || zone === "retiro") return false;
  if (zone === "interior") return true;
  const carrier = `${order.trackingCarrier || ""} ${
    order.shippingDetails?.shippingCarrier || ""
  }`.toLowerCase();
  return /andreani|correo/.test(carrier);
}

function trackingMessage(order: {
  status: OrderStatus;
  paymentMethod: string;
  shippingDetails?: { zone?: string; shippingCarrier?: string };
  trackingCarrier?: string;
}) {
  const postal = isPostalShipment(order);
  const zone = String(order.shippingDetails?.zone || "").toLowerCase();
  switch (order.status) {
    case "pendiente":
      return order.paymentMethod === "transferencia"
        ? "Estamos esperando tu transferencia. Mandanos el comprobante por WhatsApp; cuando acredite, el pedido pasa a pagado."
        : "Tu pedido está pendiente de confirmación de pago.";
    case "pagado":
      return "Pago confirmado. En breve armamos tu pedido para despachar.";
    case "preparando":
      return postal
        ? "Estamos preparando tu pedido. El código de seguimiento aparece cuando se despache."
        : "Estamos preparando tu pedido.";
    case "enviado":
      if (zone === "retiro") return "Tu pedido está listo para retirar.";
      if (postal) {
        return "Tu pedido ya salió. El tracking se carga en cuanto el correo lo informe.";
      }
      return "Tu pedido ya salió. Te llega a Rosario en el horario coordinado.";
    case "entregado":
      return "Pedido entregado. Si necesitás ayuda, escribinos por WhatsApp.";
    default:
      return postal
        ? "Todavía no hay código de seguimiento."
        : "Si necesitás algo, escribinos por WhatsApp.";
  }
}

function stepHint(status: OrderStatus) {
  switch (status) {
    case "pendiente":
      return "Esperando pago";
    case "pagado":
      return "Pago OK";
    case "preparando":
      return "Armando el pedido";
    case "enviado":
      return "En camino";
    case "entregado":
      return "Llegó a destino";
    default:
      return "Estado actual";
  }
}

function OrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { session, getOrder, ready } = useStore();

  if (!ready) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-soft">
        Cargando…
      </main>
    );
  }

  const order = getOrder(id);
  if (!order || order.userId !== session!.id) {
    return (
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl font-bold uppercase md:text-5xl">
          Pedido no encontrado
        </h1>
        <Link
          href="/cuenta/pedidos"
          className="btn-press mt-6 inline-flex bg-[#222222] px-5 py-3 text-[11px] font-semibold text-white uppercase"
        >
          Volver a mis pedidos
        </Link>
      </main>
    );
  }

  const idx = statusIndex(order.status);
  const postal = isPostalShipment(order);
  const trackHref = postal
    ? trackingUrl(order.trackingCarrier, order.trackingCode)
    : "";

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-12 lg:py-14">
      <Link
        href="/cuenta/pedidos"
        className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
      >
        ← Mis pedidos
      </Link>

      <header className="mt-4 flex flex-col gap-4 border-b border-black/5 pb-6 md:mt-6 md:flex-row md:items-end md:justify-between md:pb-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Pedido
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
            {order.id}
          </h1>
          <p className="mt-2 text-sm text-soft">
            {new Date(order.createdAt).toLocaleString("es-AR")}
          </p>
        </div>
        <p className="w-fit bg-[#222222] px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-white uppercase">
          {order.status}
        </p>
      </header>

      {order.status === "cancelado" ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mt-8">
          Este pedido fue cancelado.
        </p>
      ) : (
        <section className="mt-6 border border-black/5 bg-white p-4 md:mt-8 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase">
                {postal ? "Seguimiento" : "Estado"}
              </h2>
              {postal && order.trackingCode ? (
                <p className="mt-2 text-sm text-soft">
                  {order.trackingCarrier
                    ? `${carrierLabel(order.trackingCarrier)} · `
                    : ""}
                  Código:{" "}
                  <span className="font-semibold text-[#222222]">
                    {order.trackingCode}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-soft">
                  {trackingMessage(order)}
                </p>
              )}
            </div>
            {trackHref && (
              <a
                href={trackHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex w-fit border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Seguir envío
              </a>
            )}
          </div>

          {/* Mobile: vertical */}
          <ol className="mt-6 md:hidden">
            {STEPS.map((step, i) => {
              const done = idx >= i;
              const current = idx === i;
              return (
                <li key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex size-7 items-center justify-center text-[10px] font-bold ${
                        done
                          ? "bg-[#222222] text-white"
                          : "border border-black/15 text-soft"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`min-h-6 w-px flex-1 ${
                          idx > i ? "bg-[#222222]" : "bg-black/10"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-5">
                    <p
                      className={`text-sm font-semibold capitalize ${
                        done ? "text-[#222222]" : "text-soft"
                      }`}
                    >
                      {step}
                    </p>
                    {current && (
                      <p className="mt-0.5 text-xs text-soft">
                        {stepHint(step)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Desktop: horizontal */}
          <ol className="mt-10 hidden md:grid md:grid-cols-5 md:gap-0">
            {STEPS.map((step, i) => {
              const done = idx >= i;
              const current = idx === i;
              return (
                <li key={step} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className={`absolute top-4 left-[calc(50%+18px)] h-px w-[calc(100%-36px)] ${
                        idx > i ? "bg-[#222222]" : "bg-black/10"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-[1] flex size-8 items-center justify-center text-[11px] font-bold ${
                      done
                        ? "bg-[#222222] text-white"
                        : "border border-black/15 bg-white text-soft"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <p
                    className={`mt-3 text-[12px] font-semibold tracking-[0.08em] uppercase ${
                      done ? "text-[#222222]" : "text-soft"
                    }`}
                  >
                    {step}
                  </p>
                  {current && (
                    <p className="mt-1 text-[11px] text-soft">{stepHint(step)}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-5 md:gap-8">
        <section className="border border-black/5 bg-white p-4 md:col-span-3 md:p-8">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase">
            Items
          </h2>
          <div className="mt-4 divide-y divide-black/5 md:mt-6">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 md:gap-5 md:py-4"
              >
                <div className="relative size-14 shrink-0 bg-[#f5f4f0] md:size-20">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-contain p-1.5"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium uppercase md:text-base">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-soft md:text-sm">
                    {item.variantName} · talle {item.size} · x{item.qty}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold md:text-base">
                  {item.price}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-black/5 pt-5 text-sm md:mt-6 md:pt-6">
            <div className="flex justify-between">
              <span className="text-soft">Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-[#16a34a]">
                <span>
                  Descuento {order.promoCode ? `(${order.promoCode})` : ""}
                </span>
                <span>-{formatMoney(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-soft">Envío</span>
              <span>
                {order.shipping === 0 ? "Gratis" : formatMoney(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between border-t border-black/5 pt-3 text-base font-semibold md:text-lg">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </section>

        <section className="border border-black/5 bg-white p-4 md:col-span-2 md:p-8">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase">
            Entrega
          </h2>
          {order.shippingDetails ? (
            <dl className="mt-4 space-y-4 text-sm md:mt-6">
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
                  Destinatario
                </dt>
                <dd className="mt-1 font-medium">{order.shippingDetails.fullName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
                  Dirección
                </dt>
                <dd className="mt-1 leading-relaxed">
                  {order.shippingDetails.street} {order.shippingDetails.number}
                  {order.shippingDetails.floor
                    ? `, ${order.shippingDetails.floor}`
                    : ""}
                  <br />
                  {order.shippingDetails.city}, {order.shippingDetails.province}
                  <br />
                  CP {order.shippingDetails.postalCode}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
                  Teléfono
                </dt>
                <dd className="mt-1">{order.shippingDetails.phone}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-soft md:mt-6">{order.shippingAddress}</p>
          )}
          <div className="mt-6 border-t border-black/5 pt-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
              Método de pago
            </p>
            <p className="mt-1 text-sm font-medium capitalize">
              {order.paymentMethod}
            </p>
            {order.paymentMethod === "transferencia" &&
              order.status === "pendiente" && (
                <TransferAccountBox
                  orderId={order.id}
                  total={order.total}
                  compact
                />
              )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <ShopChrome>
      <AccountGate>
        <OrderDetail />
      </AccountGate>
    </ShopChrome>
  );
}
