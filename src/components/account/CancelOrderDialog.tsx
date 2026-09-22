"use client";

import { AppDialog } from "@/components/ui/AlertProvider";
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
    <AppDialog
      eyebrow="Cancelar pedido"
      title={`${name}, ¿cancelamos ${order.id}?`}
      message={`Se libera el stock y no se puede deshacer. Total ${formatMoney(order.total)} · ${paymentMethodLabel(order.paymentMethod)}.`}
      tone="danger"
      cancelLabel="Seguir con el pedido"
      confirmLabel={busy ? "Cancelando…" : "Sí, cancelar pedido"}
      busy={busy}
      onCancel={onClose}
      onConfirm={onConfirm}
    >
      {first ? (
        <div className="mt-4 border border-black/5 bg-[#f5f4f0] px-3 py-3 text-sm">
          <p className="font-medium uppercase">{first.productName}</p>
          <p className="mt-1 text-xs text-soft">
            {first.variantName} · talle {first.size}
            {extra > 0 ? ` · +${extra} ítem${extra === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      ) : null}
    </AppDialog>
  );
}
