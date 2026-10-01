"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Un slide puede traer arte distinto por formato. Con un solo string se usa
 * la misma imagen en ambos y el recorte lo hace el navegador. Un slide con
 * un solo formato se muestra solo en ese formato.
 *
 * Medidas de entrega:
 *   mobile  1080 × 1350  (4:5)   — se ve abajo de 640px
 *   desktop 2400 × 1350  (16:9)  — se ve de 640px para arriba. El hero toma
 *     el alto de la pantalla, pero nunca menos que una franja 2400 × 1030
 *     centrada (o apoyada abajo con position "bottom"): ahí va lo importante.
 */
type SlidePosition = "top" | "center" | "bottom";

export type HeroSlide =
  | string
  | { mobile: string; desktop?: string; position?: SlidePosition }
  | { mobile?: string; desktop: string; position?: SlidePosition };

const OBJECT_POSITION: Record<SlidePosition, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

const DESKTOP_MEDIA = "(min-width: 640px)";
const AUTOPLAY_MS = 8000;
const SWIPE_PX = 50;

function sources(slide: HeroSlide): { mobile: string; desktop: string } {
  if (typeof slide === "string") return { mobile: slide, desktop: slide };
  const mobile = slide.mobile ?? slide.desktop ?? "";
  return { mobile, desktop: slide.desktop ?? mobile };
}

function showsOn(slide: HeroSlide, desktop: boolean): boolean {
  if (typeof slide === "string") return true;
  return Boolean(desktop ? slide.desktop : slide.mobile);
}

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MEDIA);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_MEDIA).matches,
    () => false
  );
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
export function HeroCarousel({ slides: allSlides }: HeroCarouselProps) {
  const isDesktop = useIsDesktop();
  const slides = allSlides.filter((s) => showsOn(s, isDesktop));
  const count = slides.length;
  const [rawIndex, setIndex] = useState(0);
  const index = count > 0 ? rawIndex % count : 0;
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
  const position = OBJECT_POSITION[
    isDesktop && typeof slide !== "string" && slide.position
      ? slide.position
      : "center"
  ];

  const mobileVariants = {
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
  const mobileTransition = {
    x: { type: "spring" as const, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 },
  };

  /** Desktop: fundido cruzado con zoom leve, sin hueco entre slides (como Leprita). */
  const ease = [0.4, 0, 0.2, 1] as const;
  const desktopVariants = {
    enter: { opacity: 0, scale: 1.04, zIndex: 1 },
    center: { opacity: 1, scale: 1, zIndex: 1 },
    exit: {
      opacity: 0,
      scale: 1.01,
      zIndex: 0,
      transition: { opacity: { duration: 0.2, delay: 0.55 } },
    },
  };
  const desktopTransition = {
    opacity: { duration: 0.55, ease },
    scale: { duration: 0.7, ease },
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-[#222222]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative h-[calc(100svh-var(--adbar-height)-64px)] min-h-[420px] w-full overflow-hidden touch-pan-y sm:h-[clamp(calc(100vw*1030/2400),calc(100svh-var(--adbar-height)-73px),calc(100vw*1350/2400))] sm:min-h-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence
          key={isDesktop ? "desktop" : "mobile"}
          initial={false}
          custom={direction}
          mode={isDesktop ? "sync" : "wait"}
        >
          <motion.div
            key={keyOf(slide)}
            custom={direction}
            variants={isDesktop ? desktopVariants : mobileVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={isDesktop ? desktopTransition : mobileTransition}
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
                className={`pointer-events-none h-full w-full select-none object-cover ${position}`}
              />
            </picture>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute top-1/2 left-4 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:scale-110 hover:bg-black/70 sm:block"
          >
            ❮
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="absolute top-1/2 right-4 z-20 hidden -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:scale-110 hover:bg-black/70 sm:block"
          >
            ❯
          </button>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-5 sm:pb-6 md:pb-8">
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
      </div>
    </section>
  );
}
