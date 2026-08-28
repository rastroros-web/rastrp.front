"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { RosarioDeliveryFields } from "@/components/cart/RosarioDeliveryFields";
import { ShippingMethodPicker } from "@/components/cart/ShippingMethodPicker";
import { ShopChrome } from "@/components/ShopChrome";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import { isFreeShipping, quoteShipping } from "@/lib/mock/shipping";
import { STORES } from "@/lib/mock/stores";
import type { ShippingZone } from "@/lib/mock/types";

const ZONES: { id: ShippingZone; label: string }[] = [
  { id: "rosario", label: "Rosario" },
  { id: "interior", label: "Interior" },
  { id: "retiro", label: "Retiro" },
];

export default function CartPage() {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    cartTransferTotal,
    clearCart,
    cartShipping,
    setCartShipping,
    cartCount,
  } = useStore();
  const [leaving, setLeaving] = useState<Record<string, boolean>>({});

  const onRosarioChange = useCallback(
    (next: { deliveryDate?: string; deliverySlot?: string }) => {
      setCartShipping(next);
    },
    [setCartShipping]
  );

  const handleRemove = (id: string) => {
    if (leaving[id]) return;
    setLeaving((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      removeFromCart(id);
      setLeaving((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 220);
  };

  const localQuote = useMemo(
    () => quoteShipping(cartShipping.zone, cartTransferTotal),
    [cartShipping.zone, cartTransferTotal]
  );

  const freeShipping = isFreeShipping(cartTransferTotal);

  const shippingCost =
    cartShipping.zone === "interior"
      ? cartShipping.rate
        ? freeShipping
          ? 0
          : cartShipping.rate.price
        : null
      : localQuote.cost;

  const shippingLabel =
    cartShipping.zone === "interior"
      ? cartShipping.rate
        ? `${freeShipping ? "Envío gratis · " : ""}${
            cartShipping.rate.carrier === "andreani" ? "Andreani" : "Correo Argentino"
          } · ${cartShipping.rate.name}${
            cartCount > 1 ? ` · ${cartCount} pares` : ""
          }`
        : "Elegí una opción"
      : localQuote.label;

  const totalWithShipping =
    cartTransferTotal + (typeof shippingCost === "number" ? shippingCost : 0);

  return (
    <ShopChrome>
      <main className="mx-auto max-w-5xl flex-1 px-4 py-6 pb-28 md:px-6 md:py-12 md:pb-12">
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
          Carrito
        </h1>
        <p className="mt-2 text-sm text-soft">
          {cart.length === 0
            ? "Tu carrito está vacío"
            : `${cart.reduce((s, i) => s + i.qty, 0)} productos`}
        </p>

        {cart.length === 0 ? (
          <div className="mt-10">
            <Link
              href="/productos"
              className="btn-press inline-flex bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1fr_320px] lg:gap-10">
            <div className="space-y-3 md:space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-3 border border-black/5 bg-white p-3 transition-[border-color,box-shadow] duration-200 hover:border-black/15 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] sm:gap-4 sm:p-4 ${
                    leaving[item.id] ? "cart-item-leave" : ""
                  }`}
                >
                  <Link
                    href={`/productos/${item.productSlug}?color=${item.variantId}`}
                    className="relative size-20 shrink-0 bg-[#f5f4f0] transition-opacity hover:opacity-80 sm:size-24"
                  >
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-contain p-2"
                      sizes="96px"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
                      {item.brand}
                    </p>
                    <Link
                      href={`/productos/${item.productSlug}?color=${item.variantId}`}
                      className="line-clamp-2 text-sm font-medium uppercase transition-colors hover:text-brand sm:text-base"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-xs text-soft">
                      {item.variantName} · talle {item.size}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{item.price}</p>
                    <p className="text-xs text-[#16a34a]">
                      {item.transfer} con transferencia
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center overflow-hidden border border-black/10">
                        <button
                          type="button"
                          className="qty-press px-3 py-1.5 text-sm"
                          onClick={() => updateCartQty(item.id, item.qty - 1)}
                          aria-label="Restar cantidad"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="qty-press px-3 py-1.5 text-sm"
                          onClick={() => updateCartQty(item.id, item.qty + 1)}
                          aria-label="Sumar cantidad"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="link-press text-[11px] font-semibold text-soft uppercase underline underline-offset-4 decoration-transparent hover:decoration-current"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <section className="border border-black/5 bg-white p-4 sm:p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  Envío
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {ZONES.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() =>
                        setCartShipping({
                          zone: z.id,
                          // Mantener CP/tarifas en DOM para no achicar el bloque al volver.
                          rate: z.id === "interior" ? cartShipping.rate : null,
                        })
                      }
                      className={`border px-2 py-2.5 text-center text-xs font-medium transition-[background-color,border-color,color] sm:text-sm ${
                        cartShipping.zone === z.id
                          ? "border-[#222222] bg-[#222222] text-white"
                          : "border-black/10 hover:border-[#222222]"
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid">
                  <div
                    className={`col-start-1 row-start-1 ${
                      cartShipping.zone === "rosario"
                        ? "relative z-10"
                        : "invisible pointer-events-none"
                    }`}
                    aria-hidden={cartShipping.zone !== "rosario"}
                  >
                    <RosarioDeliveryFields
                      date={cartShipping.deliveryDate}
                      slot={cartShipping.deliverySlot}
                      enabled={cartShipping.zone === "rosario"}
                      onChange={onRosarioChange}
                    />
                  </div>
                  <div
                    className={`col-start-1 row-start-1 ${
                      cartShipping.zone === "interior"
                        ? "relative z-10"
                        : "invisible pointer-events-none"
                    }`}
                    aria-hidden={cartShipping.zone !== "interior"}
                  >
                    <ShippingMethodPicker
                      enabled={cartShipping.zone === "interior"}
                      postalCode={cartShipping.postalCode}
                      packages={cartCount}
                      selectedRateId={cartShipping.rate?.id}
                      onPostalCodeChange={(cp) =>
                        setCartShipping({ postalCode: cp })
                      }
                      onSelectRate={(rate) => setCartShipping({ rate })}
                    />
                  </div>
                  <div
                    className={`col-start-1 row-start-1 ${
                      cartShipping.zone === "retiro"
                        ? "relative z-10"
                        : "invisible pointer-events-none"
                    }`}
                    aria-hidden={cartShipping.zone !== "retiro"}
                  >
                    <p className="mb-3 text-xs text-soft">
                      Retiro gratis. Elegí el local.
                    </p>
                    <div className="space-y-2">
                      {STORES.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => setCartShipping({ storeId: store.id })}
                          className={`w-full border px-4 py-3 text-left transition-[background-color,border-color,color] ${
                            cartShipping.storeId === store.id
                              ? "border-[#222222] bg-[#222222] text-white"
                              : "border-black/10 hover:border-[#222222]"
                          }`}
                        >
                          <p className="text-sm font-semibold">{store.name}</p>
                          <p
                            className={`mt-0.5 text-xs ${
                              cartShipping.storeId === store.id
                                ? "text-white/70"
                                : "text-soft"
                            }`}
                          >
                            {store.address} · {store.hours}
                          </p>
                        </button>
                      ))}
                    </div>
                    <Link
                      href="/puntos-de-retiro"
                      className="mt-3 inline-block text-[11px] font-semibold uppercase underline"
                    >
                      Ver puntos
                    </Link>
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={clearCart}
                className="link-press text-[11px] font-semibold text-soft uppercase underline underline-offset-4 decoration-transparent hover:decoration-current"
              >
                Vaciar carrito
              </button>
            </div>

            <aside className="hidden h-fit border border-black/5 bg-[#f5f4f0] p-5 lg:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Resumen
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-soft">Subtotal</span>
                  <span>{formatMoney(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-[#16a34a]">
                  <span>Con transferencia</span>
                  <span className="font-medium">
                    {formatMoney(cartTransferTotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="min-w-0 text-soft">{shippingLabel}</span>
                  <span className="shrink-0">
                    {shippingCost == null
                      ? "—"
                      : shippingCost === 0
                        ? "Gratis"
                        : formatMoney(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
                  <span>Total transf.</span>
                  <span>
                    {typeof shippingCost === "number"
                      ? formatMoney(totalWithShipping)
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="mt-6 grid">
                <div
                  className={`col-start-1 row-start-1 ${
                    cartShipping.zone === "interior" && !cartShipping.rate
                      ? "relative z-10"
                      : "invisible pointer-events-none"
                  }`}
                  aria-hidden={
                    !(cartShipping.zone === "interior" && !cartShipping.rate)
                  }
                >
                  <p className="py-3 text-center text-xs text-soft">
                    Elegí Correo Argentino o Andreani para continuar.
                  </p>
                </div>
                <div
                  className={`col-start-1 row-start-1 ${
                    cartShipping.zone === "rosario" &&
                    (!cartShipping.deliveryDate || !cartShipping.deliverySlot)
                      ? "relative z-10"
                      : "invisible pointer-events-none"
                  }`}
                  aria-hidden={
                    !(
                      cartShipping.zone === "rosario" &&
                      (!cartShipping.deliveryDate || !cartShipping.deliverySlot)
                    )
                  }
                >
                  <p className="py-3 text-center text-xs text-soft">
                    Indicá día y horario de entrega para continuar.
                  </p>
                </div>
                <div
                  className={`col-start-1 row-start-1 ${
                    cartShipping.zone === "retiro" && !cartShipping.storeId
                      ? "relative z-10"
                      : "invisible pointer-events-none"
                  }`}
                  aria-hidden={
                    !(cartShipping.zone === "retiro" && !cartShipping.storeId)
                  }
                >
                  <p className="py-3 text-center text-xs text-soft">
                    Elegí un local de retiro para continuar.
                  </p>
                </div>
                <div
                  className={`col-start-1 row-start-1 ${
                    (cartShipping.zone === "interior" && !cartShipping.rate) ||
                    (cartShipping.zone === "rosario" &&
                      (!cartShipping.deliveryDate ||
                        !cartShipping.deliverySlot)) ||
                    (cartShipping.zone === "retiro" && !cartShipping.storeId)
                      ? "invisible pointer-events-none"
                      : "relative z-10"
                  }`}
                  aria-hidden={
                    (cartShipping.zone === "interior" && !cartShipping.rate) ||
                    (cartShipping.zone === "rosario" &&
                      (!cartShipping.deliveryDate ||
                        !cartShipping.deliverySlot)) ||
                    (cartShipping.zone === "retiro" && !cartShipping.storeId)
                  }
                >
                  <Link
                    href="/checkout"
                    className="btn-press flex w-full items-center justify-center bg-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-black"
                  >
                    Ir al checkout
                  </Link>
                </div>
              </div>
              <Link
                href="/productos"
                className="btn-press mt-3 flex w-full items-center justify-center border border-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase hover:bg-[#222222] hover:text-white"
              >
                Seguir comprando
              </Link>
            </aside>
          </div>
        )}
      </main>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {formatMoney(
                  typeof shippingCost === "number"
                    ? totalWithShipping
                    : cartTransferTotal
                )}
              </p>
              <p className="truncate text-[11px] text-soft">
                {shippingCost == null
                  ? "Elegí envío · cupones en checkout"
                  : `${shippingLabel} · cupones en checkout`}
              </p>
            </div>
            {cartShipping.zone === "interior" && !cartShipping.rate ? (
              <span className="shrink-0 px-3 text-right text-[11px] text-soft">
                Elegí envío
              </span>
            ) : cartShipping.zone === "rosario" &&
              (!cartShipping.deliveryDate || !cartShipping.deliverySlot) ? (
              <span className="shrink-0 px-3 text-right text-[11px] text-soft">
                Día y horario
              </span>
            ) : cartShipping.zone === "retiro" && !cartShipping.storeId ? (
              <span className="shrink-0 px-3 text-right text-[11px] text-soft">
                Elegí local
              </span>
            ) : (
              <Link
                href="/checkout"
                className="btn-press shrink-0 bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-white uppercase"
              >
                Checkout
              </Link>
            )}
          </div>
        </div>
      )}
    </ShopChrome>
  );
}
