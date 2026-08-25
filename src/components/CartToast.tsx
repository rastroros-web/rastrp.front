"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { Check, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";

export type CartToastPayload = {
  productName: string;
  brand: string;
  size: string;
  image: string;
  variantName?: string;
};

export function CartToast({
  toast,
  onClose,
}: {
  toast: CartToastPayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="cart-toast pointer-events-none fixed inset-x-3 bottom-[4.75rem] z-[80] flex justify-end md:inset-x-auto md:right-6 md:bottom-6 md:left-auto"
    >
      <div className="pointer-events-auto flex w-full max-w-sm gap-3 border border-black/10 bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.12)] md:p-4">
        <div className="relative size-16 shrink-0 overflow-hidden bg-[#f5f4f0] sm:size-[72px]">
          <Image
            src={toast.image}
            alt=""
            fill
            className="object-contain p-1.5"
            sizes="72px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#16a34a] uppercase">
              <span className="flex size-4 items-center justify-center bg-[#16a34a] text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              Agregado al carrito
            </p>
            <button
              type="button"
              onClick={onClose}
              className="link-press shrink-0 text-soft"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1 truncate text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            {toast.brand}
          </p>
          <p className="truncate text-sm font-medium uppercase leading-snug">
            {toast.productName}
          </p>
          <p className="mt-0.5 text-xs text-soft">
            {toast.variantName ? `${toast.variantName} · ` : ""}
            talle {toast.size}
          </p>
          <Link
            href="/carrito"
            className="btn-press mt-3 inline-flex items-center gap-1.5 bg-[#222222] px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-black"
          >
            <ShoppingBag className="size-3" />
            Ver carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
