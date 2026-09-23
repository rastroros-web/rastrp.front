"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Un slide puede traer arte distinto por formato. Con un solo string se usa
 * la misma imagen en ambos y el recorte lo hace el navegador.
 *
 * Medidas de entrega:
 *   mobile  1080 × 1350  (4:5)   — se ve abajo de 640px
 *   desktop 2400 × 1030  (21:9)  — se ve de 640px para arriba
 */
export type HeroSlide = string | { mobile: string; desktop: string };

const DESKTOP_MEDIA = "(min-width: 640px)";
const SWIPE_PX = 48;
const AUTOPLAY_MS = 8000;
const TRANSITION_MS = 520;

function sources(slide: HeroSlide): { mobile: string; desktop: string } {
  return typeof slide === "string"
    ? { mobile: slide, desktop: slide }
    : slide;
}

function keyOf(slide: HeroSlide, slot: string): string {
  const { mobile, desktop } = sources(slide);
  return `${slot}|${mobile}|${desktop}`;
}

function wrapIndex(i: number, count: number) {
  if (count <= 0) return 0;
  return ((i % count) + count) % count;
}

type HeroCarouselProps = {
  slides: HeroSlide[];
};

/**
 * Carrusel sin clones infinitos: el índice siempre está en 0..n-1.
 * Así el autoplay no puede “pasarse” al vacío (fondo negro).
 * Al cerrar el loop (último → primero) el salto es instantáneo.
 */
export function HeroCarousel({ slides }: HeroCarouselProps) {
  const count = slides.length;
  const loop = count > 1;

  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [animate, setAnimate] = useState(true);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastDx = useRef(0);
  const axis = useRef<"h" | "v" | null>(null);
  const indexRef = useRef(index);
  const paused = useRef(false);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const goTo = useCallback(
    (next: number, { instant = false }: { instant?: boolean } = {}) => {
      if (!loop) {
        setIndex(0);
        return;
      }
      const target = wrapIndex(next, count);
      const current = indexRef.current;
      const wrapping =
        (current === count - 1 && target === 0) ||
        (current === 0 && target === count - 1);
      setAnimate(!instant && !wrapping);
      setIndex(target);
      if (wrapping || instant) {
        // Rehabilitar transición en el próximo frame para el swipe/autoplay.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimate(true));
        });
      }
    },
    [loop, count]
  );

  const goNext = useCallback(() => {
    if (!loop || dragging.current || paused.current) return;
    goTo(indexRef.current + 1);
  }, [loop, goTo]);

  const goPrev = useCallback(() => {
    if (!loop || dragging.current || paused.current) return;
    goTo(indexRef.current - 1);
  }, [loop, goTo]);

  useEffect(() => {
    if (!loop) return;
    const id = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [loop, goNext]);

  // Pausar autoplay con la pestaña oculta (evita ticks acumulados).
  useEffect(() => {
    const onVis = () => {
      paused.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = lastDx.current;
    lastDx.current = 0;
    axis.current = null;
    setDragPx(0);
    if (!loop) {
      setAnimate(true);
      return;
    }
    if (dx <= -SWIPE_PX) goNext();
    else if (dx >= SWIPE_PX) goPrev();
    else setAnimate(true);
  }, [loop, goNext, goPrev]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!loop) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    dragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    lastDx.current = 0;
    axis.current = null;
    setAnimate(false);
    viewportRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!axis.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      axis.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      if (axis.current === "v") {
        dragging.current = false;
        setAnimate(true);
        setDragPx(0);
        return;
      }
    }
    if (axis.current !== "h") return;
    lastDx.current = dx;
    setDragPx(dx);
  };

  if (count === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-[#222222]">
      <div
        ref={viewportRef}
        className="relative aspect-[4/5] w-full cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing sm:aspect-[21/9]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="flex h-full w-full"
          style={{
            width: `${count * 100}%`,
            transform: `translate3d(calc(${(-index * 100) / count}% + ${dragPx}px), 0, 0)`,
            transition:
              animate && dragPx === 0
                ? `transform ${TRANSITION_MS}ms ease`
                : "none",
          }}
        >
          {slides.map((slide, i) => {
            const { mobile, desktop } = sources(slide);
            return (
              <div
                key={keyOf(slide, String(i))}
                className="relative h-full shrink-0 grow-0"
                style={{ width: `${100 / count}%` }}
              >
                <picture>
                  <source media={DESKTOP_MEDIA} srcSet={desktop} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mobile}
                    alt={`Banner Rastro ${i + 1}`}
                    loading="eager"
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                    className="pointer-events-none h-full w-full select-none object-cover object-center"
                  />
                </picture>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <div className="flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={keyOf(slide, "dot")}
              type="button"
              aria-label={`Ir al slide ${i + 1}`}
              aria-current={i === index ? true : undefined}
              onClick={() => goTo(i)}
              className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/45"
              }`}
            />
          ))}
        </div>
        <a
          href="#mas-vendidos"
          className="pointer-events-auto border border-white bg-white/95 px-5 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-[#222222] uppercase backdrop-blur transition hover:bg-white"
        >
          Ver más
        </a>
      </div>
    </section>
  );
}
