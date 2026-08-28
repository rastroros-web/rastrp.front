"use client";

import { useEffect, useRef, useState } from "react";

const TEXT = "25% OFF TRANSFERENCIA · 3 CUOTAS SIN INTERÉS";
const ITEM_CLASS =
  "shrink-0 px-4 text-[10px] font-semibold leading-none tracking-[0.14em] uppercase md:text-[11px]";

export function AdBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [copyCount, setCopyCount] = useState(8);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const update = () => {
      const itemWidth = measure.offsetWidth;
      if (!itemWidth) return;
      const viewport = container.offsetWidth;
      // El loop -50% necesita al menos 2× el ancho visible y un número par de ítems.
      const minCopies = Math.ceil((viewport * 2) / itemWidth);
      const even = minCopies % 2 === 0 ? minCopies : minCopies + 1;
      setCopyCount(Math.max(4, even));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[var(--adbar-height)] overflow-hidden bg-adbar text-white"
    >
      <span ref={measureRef} className={`invisible absolute ${ITEM_CLASS}`} aria-hidden>
        {TEXT}
      </span>
      <div className="flex h-full items-center">
        <div className="adbar-track flex w-max items-center whitespace-nowrap">
          {Array.from({ length: copyCount }, (_, index) => (
            <span
              key={index}
              aria-hidden={index > 0}
              className={ITEM_CLASS}
            >
              {TEXT}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
