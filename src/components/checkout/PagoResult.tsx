"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Clock, X } from "lucide-react";
import { ShopChrome } from "@/components/ShopChrome";
import {
  fetchShopOrder,
  parseShopOrderNumericId,
  syncShopPayment,
} from "@/lib/api/backend";
import { formatMoney } from "@/lib/mock/money";

type PagoVariant = "success" | "failure" | "pending";

const COPY: Record<
  PagoVariant,
  {
    eyebrow: string;
    title: string;
    description: string;
    tone: string;
  }
> = {
  success: {
    eyebrow: "Pago confirmado",
    title: "¡Listo!",
    description:
      "Recibimos la confirmación del cobro. Te estamos llevando a tu pedido…",
    tone: "border-[#16a34a]/30 bg-[#f0fdf4] text-[#16a34a]",
  },
  failure: {
    eyebrow: "Pago rechazado",
    title: "No se pudo cobrar",
    description:
      "Mercado Pago no acreditó el pago. Podés reintentar con el mismo pedido o elegir otro medio.",
    tone: "border-[#dc2626]/25 bg-[#fef2f2] text-[#dc2626]",
  },
  pending: {
    eyebrow: "Pago pendiente",
    title: "Estamos esperando",
    description:
      "Algunos medios demoran la acreditación. Cuando Mercado Pago confirme el cobro te avisamos por mail.",
    tone: "border-[#ca8a04]/30 bg-[#fefce8] text-[#a16207]",
  },
};

function orderHref(orderId: string | null) {
  if (!orderId) return "/cuenta/pedidos";
  const numeric = parseShopOrderNumericId(orderId);
  const code = numeric ? `ORD-${numeric}` : orderId;
  return `/cuenta/pedidos/${encodeURIComponent(code)}`;
}

function PagoResultInner({ variant }: { variant: PagoVariant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = COPY[variant];
  const orderId =
    searchParams.get("order_id") || searchParams.get("external_reference");
  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id");
  const status =
    searchParams.get("status") || searchParams.get("collection_status");

  const [orderLabel, setOrderLabel] = useState<string | null>(
    orderId
      ? parseShopOrderNumericId(orderId)
        ? `ORD-${parseShopOrderNumericId(orderId)}`
        : orderId
      : null
  );
  const [totalLabel, setTotalLabel] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    (async () => {
      try {
        if (variant === "success" && paymentId) {
          await syncShopPayment(orderId, paymentId).catch(() => {
            /* webhook también puede actualizar */
          });
        }
        if (cancelled) return;

        // Éxito: ir al detalle del pedido (ahí ya dice "Pago confirmado").
        if (variant === "success") {
          router.replace(orderHref(orderId));
          return;
        }

        const order = await fetchShopOrder(orderId);
        if (cancelled) return;
        setOrderLabel(order.id);
        setTotalLabel(formatMoney(order.total));
      } catch {
        if (!cancelled && variant === "success") {
          // Sin sesión igual mandamos al pedido; AccountGate pide login si hace falta.
          router.replace(orderHref(orderId));
          return;
        }
        if (!cancelled) {
          setSyncNote("No pudimos cargar el pedido. Probá desde Mi cuenta.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variant, orderId, paymentId, router]);

  const Icon =
    variant === "success" ? Check : variant === "failure" ? X : Clock;

  return (
    <ShopChrome>
      <main className="mx-auto max-w-xl flex-1 px-4 py-10 md:px-6 md:py-16">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-wide uppercase">
            {copy.title}
          </h1>
          {orderLabel && (
            <p className="mt-3 text-sm text-soft">
              Pedido <strong className="text-[#222222]">{orderLabel}</strong>
              {totalLabel ? (
                <>
                  {" "}
                  · Total{" "}
                  <strong className="text-[#222222]">{totalLabel}</strong>
                </>
              ) : null}
            </p>
          )}
          {status && variant !== "success" && (
            <p className="mt-1 text-xs capitalize text-soft">
              Estado Mercado Pago: {status}
            </p>
          )}
        </div>

        <section className={`mt-8 border p-5 text-left ${copy.tone}`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-current/10">
              <Icon className="size-4" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-semibold">Mercado Pago</p>
              <p className="mt-2 text-sm text-[#222222]/80">{copy.description}</p>
              {syncNote && (
                <p className="mt-2 text-xs text-[#222222]/60">{syncNote}</p>
              )}
              {paymentId && variant !== "success" && (
                <p className="mt-2 text-[11px] text-[#222222]/50">
                  Pago #{paymentId}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {variant === "failure" && orderId && (
            <Link
              href={`/checkout/${encodeURIComponent(orderId)}`}
              className="btn-press bg-[#222222] px-6 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Reintentar pago
            </Link>
          )}
          <Link
            href={orderHref(orderId)}
            className="btn-press border border-black/15 bg-white px-6 py-3 text-center text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            Ver pedido
          </Link>
          <Link
            href="/"
            className="btn-press px-6 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-soft uppercase"
          >
            Seguir comprando
          </Link>
        </div>
      </main>
    </ShopChrome>
  );
}

export function PagoResult({ variant }: { variant: PagoVariant }) {
  return (
    <Suspense
      fallback={
        <ShopChrome>
          <main className="flex min-h-[40vh] items-center justify-center text-sm text-soft">
            Cargando resultado…
          </main>
        </ShopChrome>
      }
    >
      <PagoResultInner variant={variant} />
    </Suspense>
  );
}
