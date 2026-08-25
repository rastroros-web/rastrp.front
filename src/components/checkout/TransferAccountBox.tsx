"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatMoney } from "@/lib/mock/money";
import { TRANSFER_ACCOUNT } from "@/lib/mock/payment";
import { TransferReceiptWhatsApp } from "@/components/checkout/TransferReceiptWhatsApp";

export function CopyRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase">
          {label}
        </p>
        <p className="mt-0.5 truncate font-medium">{value}</p>
      </div>
      {copyable && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              /* ignore */
            }
          }}
          className="btn-press shrink-0 border border-black/15 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase"
        >
          {copied ? (
            <span className="inline-flex items-center gap-1 text-[#16a34a]">
              <Check className="size-3" /> Ok
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Copy className="size-3" /> Copiar
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export function TransferAccountBox({
  orderId,
  total,
  compact = false,
}: {
  orderId: string;
  total: number;
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? "mt-4 border border-black/10 bg-[#f5f4f0] p-4"
          : "mt-8 border border-black/10 bg-white p-5 text-left"
      }
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        Datos para transferir
      </h2>
      <p className="mt-2 text-sm text-soft">
        Transferí el monto exacto y usá el número de pedido como concepto.
        Cuando acredite, confirmamos el pedido.
      </p>
      <div className="mt-4">
        <CopyRow label="Titular" value={TRANSFER_ACCOUNT.holder} />
        <CopyRow label="Banco" value={TRANSFER_ACCOUNT.bank} />
        <CopyRow label="CBU" value={TRANSFER_ACCOUNT.cbu} copyable />
        <CopyRow label="Alias" value={TRANSFER_ACCOUNT.alias} copyable />
        <CopyRow label="CUIT" value={TRANSFER_ACCOUNT.cuit} />
        <CopyRow label="Monto" value={formatMoney(total)} />
        <CopyRow label="Concepto / referencia" value={orderId} />
      </div>
      <p className="mt-4 text-xs text-soft">
        Usá el nº de pedido como concepto para identificar el pago.
      </p>
      <div className="mt-5">
        <TransferReceiptWhatsApp orderId={orderId} total={total} />
      </div>
    </section>
  );
}
