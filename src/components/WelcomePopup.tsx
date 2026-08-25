"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";

const SEEN_KEY = "rastro_welcome_popup_v1";
const OPEN_DELAY_MS = 6000;

/** Rutas donde el popup molesta más de lo que suma. */
const MUTED_PATHS = ["/cuenta", "/checkout", "/carrito", "/admin"];

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* modo incógnito: se vuelve a mostrar, no rompe nada */
  }
}

export function WelcomePopup() {
  const { session, ready } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || session) return;
    if (alreadySeen()) return;
    if (MUTED_PATHS.some((p) => pathname.startsWith(p))) return;

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, session, pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    markSeen();
    setOpen(false);
  }

  function goToRegister() {
    markSeen();
    setOpen(false);
    router.push("/cuenta/login?mode=register");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-sm border border-white/10 bg-[#222222] p-7 text-white shadow-2xl sm:max-w-md sm:p-9">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 p-1.5 text-white/50 transition hover:text-white"
        >
          <X className="size-4" strokeWidth={2} />
        </button>

        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">
          Bienvenido a Rastro
        </p>
        <h2
          id="welcome-popup-title"
          className="mt-2 font-display text-4xl leading-[0.95] font-bold tracking-wide uppercase sm:text-5xl"
        >
          10% OFF
          <span className="mt-1 block text-base font-semibold tracking-[0.08em] text-white/80 sm:text-lg">
            en tu primera compra
          </span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Registrate y te llega tu cupón al mail. Es único, es tuyo y lo usás en
          el par que más te guste.
        </p>

        <button
          type="button"
          onClick={goToRegister}
          className="btn-press mt-5 w-full bg-white px-4 py-3.5 text-[11px] font-semibold tracking-[0.14em] text-[#222222] uppercase"
        >
          Quiero mi cupón
        </button>

        <button
          type="button"
          onClick={close}
          className="mt-4 w-full text-center text-[11px] tracking-[0.1em] text-white/45 uppercase underline transition hover:text-white/70"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}
