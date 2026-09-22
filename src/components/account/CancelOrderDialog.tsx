"use client";

import { formatMoney } from "@/lib/mock/money";
import { paymentMethodLabel } from "@/lib/mock/orderLabels";
import type { MockOrder } from "@/lib/mock/types";

type Props = {
  order: MockOrder;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function CancelOrderDialog({
  order,
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  const first = order.items[0];
  const extra = Math.max(0, order.items.length - 1);
  const name = order.userName?.trim() || "hola";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="w-full max-w-md border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] font-semibold tracking-[0.16em] text-red-700 uppercase">
          Cancelar pedido
        </p>
        <h2
          id="cancel-order-title"
          className="mt-2 font-display text-2xl font-bold tracking-wide uppercase"
        >
          {name}, ¿cancelamos {order.id}?
        </h2>
        <p className="mt-3 text-sm text-soft">
          Se libera el stock y no se puede deshacer. Total{" "}
          <strong className="text-[#222222]">{formatMoney(order.total)}</strong>
          {" · "}
          {paymentMethodLabel(order.paymentMethod)}.
        </p>

        {first && (
          <div className="mt-4 border border-black/5 bg-[#f5f4f0] px-3 py-3 text-sm">
            <p className="font-medium uppercase">{first.productName}</p>
            <p className="mt-1 text-xs text-soft">
              {first.variantName} · talle {first.size}
              {extra > 0 ? ` · +${extra} ítem${extra === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="btn-press border border-black/15 px-5 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase disabled:opacity-50"
          >
            Seguir con el pedido
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="btn-press bg-[#b91c1c] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-50"
          >
            {busy ? "Cancelando…" : "Sí, cancelar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
