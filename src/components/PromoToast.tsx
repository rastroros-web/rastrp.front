"use client";

import { useEffect } from "react";
import { PartyPopper, X } from "lucide-react";

export type PromoToastPayload = {
  code: string;
  label: string;
};

export function PromoToast({
  toast,
  onClose,
}: {
  toast: PromoToastPayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className="promo-toast fixed inset-x-0 top-[calc(var(--adbar-height)+4.5rem)] z-[60] flex justify-center px-4 pointer-events-none md:top-24"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 border border-[#16a34a]/25 bg-white p-4 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
        <span className="promo-toast-icon flex size-10 shrink-0 items-center justify-center bg-[#16a34a] text-white">
          <PartyPopper className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#16a34a] uppercase">
            ¡Cupón aplicado!
          </p>
          <p className="mt-1 text-sm font-semibold text-[#222222]">
            {toast.code}
          </p>
          <p className="mt-0.5 text-sm text-soft">{toast.label}</p>
          <p className="mt-2 text-xs text-soft">
            El descuento ya está en tu resumen. ¡Buenas compras!
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-press shrink-0 p-1 text-soft hover:text-[#222222]"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
