"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatMoney } from "@/lib/mock/money";
import {
  DEFAULT_TRANSFER_BANK,
  toDisplayAccount,
  type TransferBankConfig,
} from "@/lib/mock/payment";
import { TransferReceiptWhatsApp } from "@/components/checkout/TransferReceiptWhatsApp";
import { useTransferBank } from "@/lib/hooks/useTransferBank";

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
  account,
}: {
  orderId: string;
  total: number;
  compact?: boolean;
  /** Si no se pasa, se carga desde la API (con fallback local). */
  account?: TransferBankConfig;
}) {
  const live = useTransferBank();
  const config = account ?? live.config;
  const display = toDisplayAccount(config || DEFAULT_TRANSFER_BANK);

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
        <CopyRow label="Titular" value={display.holder} />
        <CopyRow label="Banco" value={display.bank} />
        <CopyRow label="CBU" value={display.cbu} copyable />
        <CopyRow label="Alias" value={display.alias} copyable />
        <CopyRow label="CUIT" value={display.cuit} />
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
