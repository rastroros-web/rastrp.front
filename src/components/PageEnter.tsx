"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

/**
 * Animación de entrada al montar / cambiar de ruta.
 * Envuelve el contenido de cada página (no el header/footer sticky).
 */
export function PageEnter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        clearProps: "transform",
      }
    );
  }, [pathname]);

  return (
    <div
      key={pathname}
      ref={ref}
      className={`page-enter ${className}`.trim()}
      style={{ opacity: 0 }}
    >
      {children}
    </div>
  );
}
