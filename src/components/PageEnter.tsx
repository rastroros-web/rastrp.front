"use client";

import { usePathname } from "next/navigation";

/**
 * Fade de entrada al cambiar de ruta.
 * Sin transform: en Chrome mobile el translateY del wrapper
 * desvía el scroll y deja la página abajo.
 */
export function PageEnter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={`page-enter ${className}`.trim()}>
      {children}
    </div>
  );
}
