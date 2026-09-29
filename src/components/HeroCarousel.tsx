"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

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
const AUTOPLAY_MS = 8000;
const SWIPE_PX = 50;

function sources(slide: HeroSlide): { mobile: string; desktop: string } {
  return typeof slide === "string"
    ? { mobile: slide, desktop: slide }
    : slide;
}

function keyOf(slide: HeroSlide): string {
  const { mobile, desktop } = sources(slide);
  return `${mobile}|${desktop}`;
}

type HeroCarouselProps = {
  slides: HeroSlide[];
};

/**
 * Misma idea que el hero de Leprita: un solo slide visible + AnimatePresence.
 * El índice siempre es módulo n (loop infinito limpio, sin track que se pase
 * al vacío / fondo negro).
 */
export function HeroCarousel({ slides }: HeroCarouselProps) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const next = useCallback(() => {
    if (count <= 1) return;
    setDirection(1);
    setIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    if (count <= 1) return;
    setDirection(-1);
    setIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goTo = useCallback(
    (i: number) => {
      if (count <= 1) return;
      setDirection(i > index ? 1 : -1);
      setIndex(((i % count) + count) % count);
    },
    [count, index]
  );

  useEffect(() => {
    if (count <= 1 || hovered) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, hovered, next]);

  // Pausar autoplay con la pestaña oculta (evita ticks acumulados).
  useEffect(() => {
    const onVis = () => {
      setHovered(document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.targetTouches[0];
    setTouchStart({ x: t.clientX, y: t.clientY });
    setTouchEnd({ x: t.clientX, y: t.clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.targetTouches[0];
    setTouchEnd({ x: t.clientX, y: t.clientY });
    const dx = Math.abs(touchStart.x - t.clientX);
    const dy = Math.abs(touchStart.y - t.clientY);
    if (dx > dy) e.preventDefault();
  };

  const onTouchEnd = () => {
    const dx = touchStart.x - touchEnd.x;
    const dy = touchStart.y - touchEnd.y;
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE_PX) return;
    if (dx > 0) next();
    else prev();
  };

  if (count === 0) return null;

  const slide = slides[index];
  const { mobile, desktop } = sources(slide);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-[#222222]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden touch-pan-y sm:aspect-[21/9]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={keyOf(slide)}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <picture>
              <source media={DESKTOP_MEDIA} srcSet={desktop} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mobile}
                alt={`Banner Rastro ${index + 1}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
                className="pointer-events-none h-full w-full select-none object-cover object-center"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={keyOf(s)}
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
