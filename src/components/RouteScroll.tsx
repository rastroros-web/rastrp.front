"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import {
  disableScrollRestoration,
  pinWindowToTop,
} from "@/lib/scroll";

/**
 * En cada ruta deja el scroll arriba. Chrome mobile suele restaurar la
 * posición anterior o anclarse abajo cuando cargan las imágenes.
 */
export function RouteScroll() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    disableScrollRestoration();
    if (window.location.hash) return;

    pinWindowToTop();
    const frames = [0, 50].map((ms) => window.setTimeout(pinWindowToTop, ms));
    const late = window.setTimeout(() => {
      if (window.scrollY > window.innerHeight * 0.4) pinWindowToTop();
    }, 280);

    return () => {
      frames.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(late);
    };
  }, [pathname]);

  return null;
}
