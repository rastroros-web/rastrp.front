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

function sources(slide: HeroSlide): { mobile: string; desktop: string } {
  return typeof slide === "string"
    ? { mobile: slide, desktop: slide }
    : slide;
}

function keyOf(slide: HeroSlide, slot: string): string {
  const { mobile, desktop } = sources(slide);
  return `${slot}|${mobile}|${desktop}`;
}

type HeroCarouselProps = {
  slides: HeroSlide[];
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const count = slides.length;
  const loop = count > 1;
  const extended = loop ? [slides[count - 1], ...slides, slides[0]] : slides;

  const [pos, setPos] = useState(loop ? 1 : 0);
  const [dragPx, setDragPx] = useState(0);
  const [animate, setAnimate] = useState(true);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const lastDx = useRef(0);
  const axis = useRef<"h" | "v" | null>(null);
  const jumping = useRef(false);

  const realIndex = loop
    ? pos === 0
      ? count - 1
      : pos === count + 1
        ? 0
        : pos - 1
    : pos;

  const goToReal = useCallback(
    (i: number) => {
      if (!loop) {
        setPos(i);
        return;
      }
      setAnimate(true);
      setPos(i + 1);
    },
    [loop]
  );

  useEffect(() => {
    if (!loop) return;
    const id = window.setInterval(() => {
      if (dragging.current) return;
      setAnimate(true);
      setPos((current) => current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [loop]);

  const settleClones = useCallback(() => {
    if (!loop || jumping.current) return;
    if (pos === 0) {
      jumping.current = true;
      setAnimate(false);
      setPos(count);
    } else if (pos === count + 1) {
      jumping.current = true;
      setAnimate(false);
      setPos(1);
    }
  }, [loop, pos, count]);

  useEffect(() => {
    if (!jumping.current) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        jumping.current = false;
        setAnimate(true);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pos]);

  const endDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = lastDx.current;
    lastDx.current = 0;
    axis.current = null;
    setDragPx(0);
    setAnimate(true);
    if (!loop) return;
    if (dx <= -SWIPE_PX) setPos((current) => current + 1);
    else if (dx >= SWIPE_PX) setPos((current) => current - 1);
  }, [loop]);

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
            transform: `translate3d(calc(${-pos * 100}% + ${dragPx}px), 0, 0)`,
            transition: animate && dragPx === 0 ? "transform 520ms ease" : "none",
          }}
          onTransitionEnd={(e) => {
            if (e.target !== e.currentTarget) return;
            settleClones();
          }}
        >
          {extended.map((slide, i) => {
            const { mobile, desktop } = sources(slide);
            return (
              <div
                key={keyOf(slide, String(i))}
                className="relative h-full w-full shrink-0 grow-0 basis-full"
              >
                <picture>
                  <source media={DESKTOP_MEDIA} srcSet={desktop} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mobile}
                    alt={`Banner Rastro ${((i - (loop ? 1 : 0) + count) % count) + 1}`}
                    loading={i <= 1 ? "eager" : "lazy"}
                    fetchPriority={i <= 1 ? "high" : "auto"}
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
              aria-current={i === realIndex ? true : undefined}
              onClick={() => goToReal(i)}
              className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                i === realIndex ? "w-6 bg-white" : "w-1.5 bg-white/45"
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
