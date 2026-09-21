"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShopChrome } from "@/components/ShopChrome";
import {
  createShopPaymentPreference,
  fetchShopOrder,
  getBackendUrl,
  hasApiAuth,
} from "@/lib/api/backend";

const RESERVED: Record<string, string> = {
  success: "/pago/exito",
  failure: "/pago/rechazado",
  pending: "/pago/pendiente",
};

export default function CheckoutPayPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orderId = String(params?.orderId || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reserved = RESERVED[orderId];
    if (reserved) {
      router.replace(reserved);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (!orderId || RESERVED[orderId]) return;

    let cancelled = false;

    (async () => {
      try {
        if (!getBackendUrl()) {
          throw new Error("Falta configurar el backend de Mercado Pago.");
        }
        if (!hasApiAuth()) {
          throw new Error("Tenés que iniciar sesión para pagar este pedido.");
        }

        const order = await fetchShopOrder(orderId);

        if (order.status === "pagado") {
          router.replace(
            `/pago/exito?order_id=${encodeURIComponent(
              String(order.numericId || orderId)
            )}`
          );
          return;
        }

        if (order.paymentMethod !== "mercadopago") {
          throw new Error(
            "Este pedido no se paga con Mercado Pago. Revisalo en Mis pedidos."
          );
        }

        if (order.status === "cancelado") {
          throw new Error("Este pedido está cancelado.");
        }

        const preference = await createShopPaymentPreference(
          order.numericId || orderId
        );
        if (cancelled) return;

        const useSandbox =
          process.env.NEXT_PUBLIC_MERCADOPAGO_TEST_MODE === "true";
        const url =
          (useSandbox && preference.sandboxInitPoint) ||
          preference.initPoint;

        if (!url) {
          throw new Error("Mercado Pago no devolvió el link de pago.");
        }

        window.location.href = url;
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo preparar el pago con Mercado Pago."
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  return (
    <ShopChrome>
      <main className="mx-auto max-w-lg flex-1 px-4 py-16 text-center md:px-6">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#009ee3] uppercase">
          Mercado Pago
        </p>
        {error ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase">
              No pudimos redirigirte
            </h1>
            <p className="mt-3 text-sm text-soft">{error}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setLoading(true);
                  router.refresh();
                  window.location.reload();
                }}
                className="btn-press bg-[#222222] px-6 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
              >
                Reintentar
              </button>
              <Link
                href="/cuenta/pedidos"
                className="btn-press border border-black/15 px-6 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
              >
                Mis pedidos
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase">
              {loading ? "Redirigiendo…" : "Preparando pago"}
            </h1>
            <p className="mt-3 text-sm text-soft">
              Te estamos llevando al checkout seguro de Mercado Pago.
            </p>
            <div className="mx-auto mt-8 h-1 w-40 overflow-hidden bg-black/5">
              <div className="h-full w-1/2 animate-pulse bg-[#009ee3]" />
            </div>
          </>
        )}
      </main>
    </ShopChrome>
  );
}
