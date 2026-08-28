"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { ShopChrome } from "@/components/ShopChrome";
import { PromoToast, type PromoToastPayload } from "@/components/PromoToast";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import { TRANSFER_ACCOUNT } from "@/lib/mock/payment";
import { TransferAccountBox } from "@/components/checkout/TransferAccountBox";
import { calcPromoDiscount, findPromo, validatePromo, promoRulesText } from "@/lib/mock/promos";
import {
  getBackendUrl,
  hasApiAuth,
  newCheckoutIdempotencyKey,
  validateShopPromo,
} from "@/lib/api/backend";
import { HOLIDAYS_NOTE, isFreeShipping, quoteShipping } from "@/lib/mock/shipping";
import { RosarioDeliveryFields, slotLabel } from "@/components/cart/RosarioDeliveryFields";
import { ShippingMethodPicker } from "@/components/cart/ShippingMethodPicker";
import { FancySelect } from "@/components/ui/FancySelect";
import {
  argentinaProvinceOptions,
  matchArgentinaProvince,
} from "@/lib/argentinaProvinces";
import { getStore, STORES, storeHasCartStock } from "@/lib/mock/stores";
import type {
  MockOrder,
  SavedAddress,
  ShippingDetails,
  ShippingZone,
  TrackingCarrier,
} from "@/lib/mock/types";

const GUEST_ADDRESSES_KEY = "rastro_guest_addresses";

function readGuestAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_ADDRESSES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestAddresses(addresses: SavedAddress[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_ADDRESSES_KEY, JSON.stringify(addresses));
}

function addressFromFields(input: {
  fullName: string;
  phone: string;
  street: string;
  number: string;
  floor: string;
  city: string;
  province: string;
  postalCode: string;
  dni: string;
}): SavedAddress | null {
  const street = input.street.trim();
  const number = input.number.trim();
  const city = input.city.trim();
  if (!street || !number || !city) return null;
  return {
    id: `${street}-${number}-${city}-${input.postalCode}`.toLowerCase(),
    label: `${street} ${number}, ${city}`,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    street,
    number,
    floor: input.floor.trim() || undefined,
    city,
    province: input.province.trim(),
    postalCode: input.postalCode.trim(),
    dni: input.dni.trim() || undefined,
  };
}

function isSameDayWindow() {
  const now = new Date();
  const day = now.getDay(); // 0 Sun ... 6 Sat
  const hour = now.getHours();
  const isWeekday = day >= 1 && day <= 5;
  return isWeekday && hour < 16;
}

function toTrackingCarrier(carrier?: string): TrackingCarrier {
  return carrier === "andreani" ? "andreani" : "correo_argentino";
}

function formatShippingAddress(details: ShippingDetails) {
  if (details.zone === "retiro") {
    return `Retiro: ${details.storeName ?? details.storeId} · ${details.fullName} · Tel ${details.phone}`;
  }
  const floor = details.floor ? `, ${details.floor}` : "";
  const base = `${details.street} ${details.number}${floor}, ${details.city}, ${details.province} (CP ${details.postalCode})`;
  if (details.zone === "rosario") {
    const when =
      details.deliveryDate || details.deliverySlot
        ? ` · Entrega ${details.deliveryDate ?? ""}${
            details.deliverySlot ? ` ${slotLabel(details.deliverySlot)}` : ""
          }`
        : "";
    return details.sameDayEligible
      ? `${base} · Envío en el día (compra antes de las 16 hs)${when}`
      : `${base} · Rosario y alrededores${when}`;
  }
  const ship =
    details.shippingRateName
      ? ` · ${details.shippingCarrier === "andreani" ? "Andreani" : "Correo Argentino"} · ${details.shippingRateName}`
      : "";
  return `${base} · DNI ${details.dni} · Tel ${details.phone}${ship}`;
}

const fieldClass =
  "w-full border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#222222]";

export default function CheckoutPage() {
  const {
    ready,
    session,
    cart,
    cartSubtotal,
    cartTransferTotal,
    placeOrder,
    orders,
    promos,
    cartShipping,
    setCartShipping,
    cartCount,
  } = useStore();
  const [paymentMethod, setPaymentMethod] =
    useState<MockOrder["paymentMethod"]>("transferencia");
  const zone = cartShipping.zone;
  const postalCode =
    zone === "rosario"
      ? cartShipping.postalCode || "2000"
      : cartShipping.postalCode;
  const setZone = (value: ShippingZone) => {
    setCartShipping({
      zone: value,
      postalCode:
        value === "interior"
          ? cartShipping.postalCode
          : value === "rosario"
            ? "2000"
            : "",
      rate: value === "interior" ? cartShipping.rate : null,
    });
  };
  const [storeId, setStoreId] = useState(
    () => cartShipping.storeId || STORES[0].id
  );
  const [done, setDone] = useState<MockOrder | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef(newCheckoutIdempotencyKey());

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [city, setCity] = useState("Rosario");
  const [province, setProvince] = useState("Santa Fe");
  const [dni, setDni] = useState("");
  const [notes, setNotes] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoToast, setPromoToast] = useState<PromoToastPayload | null>(null);
  const [mpPhase, setMpPhase] = useState<"idle" | "redirect" | "ok">("idle");
  const [accountPassword, setAccountPassword] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const closePromoToast = useCallback(() => setPromoToast(null), []);

  const sameDayEligible = useMemo(
    () => zone === "rosario" && isSameDayWindow(),
    [zone]
  );

  const merchandise = useMemo(
    () =>
      paymentMethod === "transferencia" ? cartTransferTotal : cartSubtotal,
    [paymentMethod, cartTransferTotal, cartSubtotal]
  );

  const listTotal = cartSubtotal;

  const applyPromo = async () => {
    if (hasApiAuth() || getBackendUrl()) {
      try {
        const applied = await validateShopPromo(promoInput, merchandise);
        setPromoCode(applied.code);
        setPromoError("");
        setPromoToast({ code: applied.code, label: applied.label });
      } catch (err) {
        setPromoCode("");
        setPromoError(
          err instanceof Error ? err.message : "Cupón inválido"
        );
        setPromoToast(null);
      }
      return;
    }
    const check = validatePromo(promoInput, {
      merchandise,
      userId: session?.id,
      orders,
      catalog: promos,
    });
    if (!check.ok) {
      setPromoCode("");
      setPromoError(check.error);
      setPromoToast(null);
      return;
    }
    setPromoCode(check.promo.code);
    setPromoError("");
    setPromoToast({ code: check.promo.code, label: check.promo.label });
  };

  const promo = useMemo(
    () => (promoCode ? findPromo(promoCode, promos) : null),
    [promoCode, promos]
  );

  const discount = useMemo(
    () => calcPromoDiscount(promo, merchandise),
    [promo, merchandise]
  );

  useEffect(() => {
    if (!promoCode) return;
    const check = validatePromo(promoCode, {
      merchandise,
      userId: session?.id,
      orders,
      catalog: promos,
    });
    if (!check.ok) {
      setPromoCode("");
      setPromoError(check.error);
      setPromoToast(null);
    }
  }, [merchandise, promoCode, session?.id, orders, promos]);

  const shippingQuote = useMemo(() => {
    const free = isFreeShipping(merchandise);
    if (zone === "interior") {
      if (cartShipping.rate) {
        const carrier =
          cartShipping.rate.carrier === "andreani"
            ? "Andreani"
            : "Correo Argentino";
        return {
          zone,
          label: `${free ? "Envío gratis · " : ""}${carrier} · ${cartShipping.rate.name}${
            cartCount > 1 ? ` · ${cartCount} pares` : ""
          }`,
          cost: free ? 0 : cartShipping.rate.price,
          eta: `${cartShipping.rate.daysMin} a ${cartShipping.rate.daysMax} días hábiles desde Rosario. ${HOLIDAYS_NOTE}`,
        };
      }
      return {
        zone,
        label: "Elegí Correo o Andreani",
        cost: 0,
        eta: `Ingresá tu CP y seleccioná una tarifa. ${HOLIDAYS_NOTE}`,
      };
    }
    return quoteShipping(zone, merchandise);
  }, [zone, merchandise, cartShipping.rate, cartCount]);

  const shippingCost = shippingQuote.cost;

  const total = Math.max(0, merchandise - discount + shippingCost);
  const canConfirm =
    mpPhase === "idle" &&
    !submitting &&
    !(zone === "interior" && !cartShipping.rate) &&
    !(
      zone === "rosario" &&
      (!cartShipping.deliveryDate || !cartShipping.deliverySlot)
    );

  const cartSlugs = useMemo(
    () => [...new Set(cart.map((c) => c.productSlug))],
    [cart]
  );
  const selectedStore = getStore(storeId);
  const storeStock = selectedStore
    ? storeHasCartStock(selectedStore, cartSlugs)
    : { ok: true, missing: [] as string[] };

  useEffect(() => {
    if (!session) return;
    setFullName((name) => name || session.name || "");
    setEmail((value) => value || session.email || "");
    setPhone((value) => value || session.phone || "");
    if (session.province) setProvince(matchArgentinaProvince(session.province));
    if (session.dni) setDni((value) => value || session.dni || "");
  }, [session]);

  const applyAddress = useCallback(
    (address: SavedAddress) => {
      setSelectedAddressId(address.id);
      if (address.fullName) setFullName(address.fullName);
      if (address.phone) setPhone(address.phone);
      setStreet(address.street);
      setNumber(address.number);
      setFloor(address.floor || "");
      setCity(address.city);
      if (address.province) setProvince(matchArgentinaProvince(address.province));
      if (address.dni) setDni(address.dni);
      if (address.postalCode) setCartShipping({ postalCode: address.postalCode });
    },
    [setCartShipping]
  );

  const applyAddressIfIdle = useCallback(
    (address: SavedAddress) => {
      if (cartShipping.zone === "interior" && cartShipping.rate) return;
      applyAddress(address);
    },
    [applyAddress, cartShipping.rate, cartShipping.zone]
  );

  useEffect(() => {
    const fromSession = session?.addresses || [];
    const fromGuest = session ? [] : readGuestAddresses();
    const list = fromSession.length ? fromSession : fromGuest;
    setSavedAddresses(list);
    if (list[0]) applyAddressIfIdle(list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cargar sesión
  }, [session]);

  useEffect(() => {
    if (zone === "rosario") {
      setCity((c) => (c.trim() ? c : "Rosario"));
      setProvince("Santa Fe");
      if (!postalCode) {
        setCartShipping({ postalCode: "2000" });
      }
    }
  }, [zone, postalCode, setCartShipping]);

  useEffect(() => {
    if (!done) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
  }, [done]);

  if (!ready) {
    return (
      <ShopChrome>
        <main className="flex min-h-[40vh] items-center justify-center text-sm text-soft">
          Cargando checkout…
        </main>
      </ShopChrome>
    );
  }

  if (done) {
    const isTransfer = done.paymentMethod === "transferencia";
    return (
      <ShopChrome>
        <main className="mx-auto max-w-xl flex-1 px-4 py-10 md:px-6 md:py-16">
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
              {isTransfer ? "Pedido reservado" : "Pago confirmado"}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-wide uppercase">
              {isTransfer ? "Transferí para confirmar" : "¡Listo!"}
            </h1>
            <p className="mt-3 text-sm text-soft">
              Pedido <strong className="text-[#222222]">{done.id}</strong> · Total{" "}
              <strong className="text-[#222222]">{formatMoney(done.total)}</strong>
            </p>
            <p className="mt-1 text-xs capitalize text-soft">
              Estado: {done.status}
              {isTransfer
                ? " — pendiente hasta acreditar el pago"
                : " — pago aprobado"}
            </p>
          </div>

          {isTransfer ? (
            <TransferAccountBox orderId={done.id} total={done.total} />
          ) : (
            <section className="mt-8 border border-[#16a34a]/30 bg-[#f0fdf4] p-5 text-left">
              <p className="text-sm font-semibold text-[#16a34a]">
                Mercado Pago · pago aprobado
              </p>
              <p className="mt-2 text-sm text-soft">
                Recibimos la confirmación del cobro. Ya podés seguir el estado
                del pedido desde tu cuenta.
              </p>
            </section>
          )}

          {done.shippingDetails?.sameDayEligible && (
            <p className="mt-4 text-center text-sm font-medium text-[#16a34a]">
              Envío en el día a Rosario / alrededores (compra antes de las 16 hs).
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/cuenta/pedidos/${done.id}`}
              className="btn-press bg-[#222222] px-5 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Seguir pedido
            </Link>
            <Link
              href="/productos"
              className="btn-press border border-[#222222] px-5 py-3 text-center text-[11px] font-semibold tracking-[0.14em] uppercase"
            >
              Seguir comprando
            </Link>
          </div>
        </main>
      </ShopChrome>
    );
  }

  if (cart.length === 0) {
    return (
      <ShopChrome>
        <main className="mx-auto max-w-xl flex-1 px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">Checkout</h1>
          <p className="mt-2 text-sm text-soft">No hay productos en el carrito</p>
          <Link
            href="/productos"
            className="btn-press mt-6 inline-flex bg-[#222222] px-5 py-3 text-[11px] font-semibold text-white uppercase"
          >
            Ir al catálogo
          </Link>
        </main>
      </ShopChrome>
    );
  }

  return (
    <ShopChrome>
      <main className="mx-auto max-w-5xl flex-1 px-4 py-6 pb-28 md:px-6 md:py-12 md:pb-12">
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-soft">
          Completá tus datos y elegí envío o retiro.
        </p>

        <form
          className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_320px] lg:gap-8"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");

            if (zone === "rosario") {
              if (!cartShipping.deliveryDate || !cartShipping.deliverySlot) {
                setError(
                  "Para envíos en Rosario indicá día y horario disponibles para la entrega."
                );
                return;
              }
            }

            if (zone === "interior") {
              if (!dni.trim() || !postalCode.trim() || !province.trim()) {
                setError(
                  "Para envíos fuera de Rosario completá DNI, provincia y código postal."
                );
                return;
              }
              if (!cartShipping.rate) {
                setError("Elegí una opción de envío: Correo Argentino o Andreani.");
                return;
              }
            }

            if (zone === "retiro") {
              if (!storeId || !selectedStore) {
                setError("Elegí un punto de retiro.");
                return;
              }
              if (!storeStock.ok) {
                setError(
                  "Ese local no tiene stock de todos los productos de tu carrito. Elegí otro punto o envío a domicilio."
                );
                return;
              }
            }

            if (promoCode) {
              if (hasApiAuth() || getBackendUrl()) {
                try {
                  await validateShopPromo(promoCode, merchandise);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Ese cupón ya no se puede usar."
                  );
                  setPromoCode("");
                  setPromoToast(null);
                  return;
                }
              } else {
                const check = validatePromo(promoCode, {
                  merchandise,
                  userId: session?.id,
                  orders,
                  catalog: promos,
                });
                if (!check.ok) {
                  setError(check.error);
                  setPromoCode("");
                  return;
                }
              }
            }

            const store = zone === "retiro" ? selectedStore : undefined;
            const details: ShippingDetails = {
              zone,
              fullName: fullName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              street:
                zone === "retiro"
                  ? store?.address ?? "Retiro"
                  : street.trim(),
              number: zone === "retiro" ? "—" : number.trim(),
              floor: zone === "retiro" ? undefined : floor.trim() || undefined,
              city: zone === "retiro" ? store?.city ?? "Rosario" : city.trim(),
              province:
                zone === "retiro" ? "Santa Fe" : province.trim(),
              postalCode:
                zone === "retiro" ? "2000" : postalCode.trim(),
              dni: zone === "interior" ? dni.trim() : undefined,
              notes: notes.trim() || undefined,
              sameDayEligible: zone === "rosario" ? sameDayEligible : false,
              deliveryDate:
                zone === "rosario" ? cartShipping.deliveryDate : undefined,
              deliverySlot:
                zone === "rosario" ? cartShipping.deliverySlot : undefined,
              storeId: store?.id,
              storeName: store?.name,
              shippingRateId:
                zone === "interior" ? cartShipping.rate?.id : undefined,
              shippingQuoteId:
                zone === "interior"
                  ? cartShipping.rate?.quoteId ?? undefined
                  : undefined,
              shippingRateName:
                zone === "interior" ? cartShipping.rate?.name : undefined,
              shippingCarrier:
                zone === "interior"
                  ? toTrackingCarrier(cartShipping.rate?.carrier)
                  : "rastro",
            };

            setSubmitting(true);
            const result = await placeOrder({
              paymentMethod,
              shippingAddress: formatShippingAddress(details),
              shippingDetails: details,
              promoCode: promoCode || undefined,
              shippingCost,
              discount,
              idempotencyKey: idempotencyKeyRef.current,
              guest: session
                ? undefined
                : {
                    name: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    password: accountPassword || undefined,
                  },
            });
            setSubmitting(false);
            if (!result.ok) {
              if (/Ya tenés cuenta/i.test(result.error || "")) {
                setNeedPassword(true);
              }
              if (
                /Idempotency-Key ya se usó/i.test(result.error || "")
              ) {
                idempotencyKeyRef.current = newCheckoutIdempotencyKey();
              }
              setError(result.error || "No se pudo confirmar el pedido.");
              return;
            }

            const saved = addressFromFields({
              fullName,
              phone,
              street: details.street,
              number: details.number,
              floor: details.floor || "",
              city: details.city,
              province: details.province,
              postalCode: details.postalCode,
              dni: details.dni || "",
            });
            if (saved && zone !== "retiro") {
              const next = [
                saved,
                ...savedAddresses.filter((row) => row.id !== saved.id),
              ].slice(0, 5);
              setSavedAddresses(next);
              if (!session) writeGuestAddresses(next);
            }

            if (paymentMethod === "mercadopago") {
              setMpPhase("redirect");
              window.setTimeout(() => {
                setMpPhase("ok");
                window.setTimeout(() => {
                  setMpPhase("idle");
                  setDone(result.order);
                }, 900);
              }, 1600);
              return;
            }

            setDone(result.order);
          }}
        >
          <div className="space-y-6">
            <section className="border border-black/5 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Entrega
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["rosario", "Rosario / envío"],
                    ["interior", "Interior"],
                    ["retiro", "Punto de retiro"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setZone(value)}
                    className={`chip-press border px-3 py-3 text-left text-sm font-medium ${
                      zone === value
                        ? "border-[#222222] bg-[#222222] text-white"
                        : "border-black/10 hover:border-[#222222]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {zone === "retiro" && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-soft">
                    Retiro gratis. Elegí el local con stock de tu carrito.
                  </p>
                  {STORES.map((store) => {
                    const stock = storeHasCartStock(store, cartSlugs);
                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          setStoreId(store.id);
                          setCartShipping({ storeId: store.id });
                        }}
                        className={`chip-press w-full border px-4 py-3 text-left ${
                          storeId === store.id
                            ? "border-[#222222] bg-[#222222] text-white"
                            : "border-black/10 hover:border-[#222222]"
                        }`}
                      >
                        <p className="text-sm font-semibold">{store.name}</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            storeId === store.id
                              ? "text-white/70"
                              : "text-soft"
                          }`}
                        >
                          {store.address} · {store.hours}
                        </p>
                        <p
                          className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
                            stock.ok
                              ? storeId === store.id
                                ? "text-[#86efac]"
                                : "text-[#16a34a]"
                              : storeId === store.id
                                ? "text-red-200"
                                : "text-red-600"
                          }`}
                        >
                          {stock.ok
                            ? "Stock OK"
                            : `Sin stock de ${stock.missing.length} ítem(s)`}
                        </p>
                      </button>
                    );
                  })}
                  <Link
                    href="/puntos-de-retiro"
                    className="inline-block text-[11px] font-semibold uppercase underline"
                  >
                    Ver puntos
                  </Link>
                </div>
              )}

              {zone === "rosario" ? (
                <div
                  className={`mt-4 border px-4 py-3 text-sm ${
                    sameDayEligible
                      ? "border-[#16a34a]/30 bg-[#16a34a]/5 text-[#166534]"
                      : "border-black/10 bg-[#f5f4f0] text-soft"
                  }`}
                >
                  {sameDayEligible ? (
                    <>
                      <p className="font-semibold">Envío en el día disponible</p>
                      <p className="mt-1">
                        Compraste antes de las 16:00 hs. Despachamos hoy a Rosario
                        y alrededores.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#222222]">
                        Envío en el día: comprá antes de las 16:00 hs
                      </p>
                      <p className="mt-1">
                        Fuera de esa franja (o fin de semana), el pedido sale el
                        siguiente día hábil.
                      </p>
                    </>
                  )}
                  <Link
                    href="/envios"
                    className="mt-2 inline-block text-[11px] font-semibold uppercase underline"
                  >
                    Ver política de envíos
                  </Link>
                  <RosarioDeliveryFields
                    className="mt-4"
                    date={cartShipping.deliveryDate}
                    slot={cartShipping.deliverySlot}
                    onChange={(next) => setCartShipping(next)}
                  />
                </div>
              ) : zone === "interior" ? (
                <div className="mt-4 border border-black/10 bg-[#f5f4f0] px-4 py-3 text-sm text-soft">
                  {cartShipping.rate ? (
                    <>
                      <p className="font-semibold text-[#222222]">
                        Envío al interior · CP {postalCode}
                      </p>
                      <p className="mt-1">
                        Ya elegiste {cartShipping.rate.carrier === "andreani"
                          ? "Andreani"
                          : "Correo Argentino"}{" "}
                        · {cartShipping.rate.name}. Completá tus datos de
                        entrega abajo.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#222222]">
                        Completá todos los datos de envío
                      </p>
                      <p className="mt-1">
                        Fuera de Rosario pedimos DNI, CP, provincia y teléfono
                        para que el correo pueda entregar sin demoras. Elegí
                        Correo Argentino o Andreani.
                      </p>
                    </>
                  )}
                  <ShippingMethodPicker
                    className="mt-4"
                    postalCode={postalCode}
                    packages={cartCount}
                    selectedRateId={cartShipping.rate?.id}
                    selectedRate={cartShipping.rate}
                    onPostalCodeChange={(cp) =>
                      setCartShipping({ postalCode: cp })
                    }
                    onSelectRate={(rate) => setCartShipping({ rate })}
                  />
                </div>
              ) : null}
            </section>

            <section className="border border-black/5 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                {zone === "retiro" ? "Datos de contacto" : "Datos de envío"}
              </h2>
              {!session && (
                <p className="mt-2 text-sm text-soft">
                  No hace falta crear cuenta. Si ya estás registrado, te pedimos
                  la contraseña al confirmar.
                </p>
              )}
              {zone !== "retiro" && savedAddresses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {savedAddresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => applyAddress(address)}
                      className={`border px-3 py-2 text-left text-xs ${
                        selectedAddressId === address.id
                          ? "border-[#222222] bg-[#222222] text-white"
                          : "border-black/10 bg-[#f5f4f0]"
                      }`}
                    >
                      <span className="block font-semibold uppercase tracking-wide">
                        {address.label || `${address.street} ${address.number}`}
                      </span>
                      <span className="mt-0.5 block text-[11px] opacity-80">
                        {address.city}
                        {address.postalCode ? ` · CP ${address.postalCode}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Nombre y apellido *
                  </span>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Teléfono / WhatsApp *
                  </span>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldClass}
                    placeholder="+54 341 ..."
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Email *
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    disabled={Boolean(session)}
                  />
                </label>

                {!session && (
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                      {needPassword
                        ? "Contraseña de tu cuenta *"
                        : "Contraseña (si ya tenés cuenta)"}
                    </span>
                    <input
                      type="password"
                      required={needPassword}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      className={fieldClass}
                      autoComplete="current-password"
                    />
                    {needPassword && (
                      <span className="mt-1 block text-xs text-soft">
                        Ese email ya está registrado. Ingresá la contraseña para
                        confirmar.
                      </span>
                    )}
                  </label>
                )}

                {zone === "interior" && (
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                      DNI del destinatario *
                    </span>
                    <input
                      required
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      className={fieldClass}
                      placeholder="Sin puntos"
                    />
                  </label>
                )}

                {zone !== "retiro" && (
                  <>
                <label className="block text-sm">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Calle *
                  </span>
                  <input
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Número *
                  </span>
                  <input
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Piso / depto
                  </span>
                  <input
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className={fieldClass}
                    placeholder="Opcional"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Ciudad / localidad *
                  </span>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                {zone === "rosario" ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                      Provincia
                    </span>
                    <input
                      readOnly
                      value="Santa Fe"
                      className={fieldClass}
                    />
                  </label>
                ) : (
                  <div className="block text-sm">
                    <FancySelect
                      label={`Provincia${zone === "interior" ? " *" : ""}`}
                      value={province}
                      options={argentinaProvinceOptions}
                      onChange={setProvince}
                      placeholder="Seleccioná provincia"
                      className="[&_button]:normal-case [&_button]:tracking-normal [&_li_button]:normal-case [&_li_button]:tracking-normal"
                    />
                  </div>
                )}

                {zone === "rosario" ? (
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                      Código postal
                    </span>
                    <input
                      value={postalCode}
                      readOnly
                      className={fieldClass}
                    />
                  </label>
                ) : null}
                  </>
                )}

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Notas / referencias
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className={fieldClass}
                    placeholder={
                      zone === "retiro"
                        ? "Ej: retiro a la tarde, otro nombre…"
                        : zone === "interior"
                          ? "Ej: timbre roto, dejar en portería…"
                          : "Ej: portero eléctrico, horario preferido…"
                    }
                  />
                </label>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </section>

            <section className="border border-black/5 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Medio de pago
              </h2>
              <div className="mt-4 space-y-2">
                {(
                  [
                    ["transferencia", "Transferencia (−25%)"],
                    ["mercadopago", "Mercado Pago"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`chip-press flex cursor-pointer items-center gap-3 border px-3 py-3 text-sm ${
                      paymentMethod === value
                        ? "border-[#222222] bg-[#f5f4f0]"
                        : "border-black/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pay"
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {paymentMethod === "transferencia" ? (
                <div className="mt-4 border border-black/10 bg-[#f5f4f0] p-4 text-sm">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
                    Vas a pagar por transferencia
                  </p>
                  <p className="mt-2 text-soft">
                    Al confirmar te mostramos CBU, alias y el total a
                    transferir. El pedido queda{" "}
                    <strong className="text-[#222222]">pendiente</strong> hasta
                    acreditar el pago. Después mandanos el comprobante por
                    WhatsApp.
                  </p>
                  <p className="mt-3 font-semibold">
                    Total a transferir: {formatMoney(total)}
                  </p>
                  <p className="mt-1 text-xs text-soft">
                    Alias: {TRANSFER_ACCOUNT.alias}
                  </p>
                </div>
              ) : (
                <div className="mt-4 border border-[#009ee3]/25 bg-[#e8f7fc] p-4 text-sm">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#009ee3]">
                    Mercado Pago
                  </p>
                  <p className="mt-2 text-soft">
                    Al confirmar te redirigimos a Mercado Pago para completar el
                    pago de forma segura.
                  </p>
                  <p className="mt-3 font-semibold">
                    Total: {formatMoney(total)}
                  </p>
                </div>
              )}
            </section>

            <section className="border border-black/5 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Cupón de descuento
              </h2>
              <p className="mt-2 text-xs text-soft">
                {paymentMethod === "transferencia"
                  ? "El cupón se aplica al precio con transferencia, no al precio de lista."
                  : "El cupón se aplica al precio de lista."}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyPromo();
                    }
                  }}
                  className={fieldClass}
                />
                <button
                  type="button"
                  className="btn-press shrink-0 border border-[#222222] bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase hover:border-brand"
                  onClick={applyPromo}
                >
                  Aplicar
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-sm text-red-600">{promoError}</p>
              )}
              {promo && (
                <p className="mt-2 text-sm font-medium text-[#16a34a]">
                  ✓ {promo.label} aplicado
                  <button
                    type="button"
                    className="link-press ml-3 text-[11px] font-semibold uppercase underline text-soft"
                    onClick={() => {
                      setPromoCode("");
                      setPromoInput("");
                      setPromoToast(null);
                    }}
                  >
                    Quitar
                  </button>
                </p>
              )}
              {promo ? (
                <p className="mt-3 text-[11px] text-soft">
                  {promoRulesText(promo).join(" · ")}
                </p>
              ) : null}
            </section>
          </div>

          <aside className="h-fit border border-black/5 bg-[#f5f4f0] p-4 sm:p-5 lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Resumen
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {cart.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-soft">
                      {i.productName} ×{i.qty}
                    </span>
                    <span className="block text-[11px] text-soft">
                      Talle {i.size}
                      {i.variantName ? ` · ${i.variantName}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0">
                    {paymentMethod === "transferencia" ? i.transfer : i.price}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm">
              {paymentMethod === "transferencia" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-soft">Productos</span>
                    <span className="text-soft line-through">
                      {formatMoney(listTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#16a34a]">
                    <span>25% OFF transferencia</span>
                    <span>
                      -{formatMoney(listTotal - cartTransferTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-soft">Subtotal productos</span>
                    <span>{formatMoney(cartTransferTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-soft">Subtotal</span>
                  <span>{formatMoney(merchandise)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-[#16a34a]">
                  <span>
                    Cupón {promo?.code}
                    {promo?.type === "percent"
                      ? paymentMethod === "transferencia"
                        ? ` (${promo.value}% sobre transferencia)`
                        : ` (${promo.value}% sobre lista)`
                      : ""}
                  </span>
                  <span>-{formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-soft">{shippingQuote.label}</span>
                <span>
                  {zone === "interior" && !cartShipping.rate
                    ? "—"
                    : shippingCost === 0
                      ? "Gratis"
                      : formatMoney(shippingCost)}
                </span>
              </div>
              <p className="text-[11px] text-soft">{shippingQuote.eta}</p>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!canConfirm}
              className="btn-press mt-6 hidden w-full bg-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-50 lg:block"
            >
              {paymentMethod === "mercadopago"
                ? submitting
                  ? "Confirmando…"
                  : "Pagar con Mercado Pago"
                : submitting
                  ? "Confirmando…"
                  : "Confirmar y ver datos de transferencia"}
            </button>
          </aside>

          {/* Mobile sticky confirm */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{formatMoney(total)}</p>
                <p className="text-[11px] text-soft">Total a pagar</p>
              </div>
              <button
                type="submit"
                disabled={!canConfirm}
                className="btn-press shrink-0 bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.12em] text-white uppercase disabled:opacity-50"
              >
                {submitting
                  ? "Confirmando…"
                  : paymentMethod === "mercadopago"
                    ? "Pagar"
                    : "Confirmar"}
              </button>
            </div>
          </div>
        </form>
      </main>
      <PromoToast toast={promoToast} onClose={closePromoToast} />

      {mpPhase !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm border border-black/10 bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#009ee3] uppercase">
              Mercado Pago
            </p>
            {mpPhase === "redirect" ? (
              <>
                <h2 className="mt-3 font-display text-2xl font-bold uppercase">
                  Procesando pago…
                </h2>
                <p className="mt-2 text-sm text-soft">
                  Simulación de redirección. No se cobra dinero real.
                </p>
                <div className="mx-auto mt-6 h-1 w-40 overflow-hidden bg-black/5">
                  <div className="h-full w-1/2 animate-pulse bg-[#009ee3]" />
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mt-2 flex size-12 items-center justify-center bg-[#16a34a] text-white">
                  <Check className="size-6" strokeWidth={2.5} />
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold uppercase">
                  Pago aprobado
                </h2>
                <p className="mt-2 text-sm text-soft">
                  Volviendo al pedido…
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </ShopChrome>
  );
}
