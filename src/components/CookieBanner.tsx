"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "rastro_cookies_ok_v1";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-black/10 bg-white p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] md:p-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-soft">
          Usamos cookies propias para el carrito, la sesión y tus preferencias.{" "}
          <Link href="/cookies" className="font-semibold text-[#222222] underline">
            Política de cookies
          </Link>
          {" · "}
          <Link href="/privacidad" className="font-semibold text-[#222222] underline">
            Privacidad
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
            onClick={() => {
              try {
                localStorage.setItem(KEY, "essential");
              } catch {
                /* ignore */
              }
              setOpen(false);
            }}
          >
            Solo esenciales
          </button>
          <button
            type="button"
            className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase"
            onClick={() => {
              try {
                localStorage.setItem(KEY, "all");
              } catch {
                /* ignore */
              }
              setOpen(false);
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
