"use client";

import { useEffect, useState } from "react";

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

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className="relative w-full overflow-hidden bg-[#222222]">
      {/* Mobile: portrait 4:5 · Desktop: wide 21:9 */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[21/9]">
        {slides.map((slide, i) => {
          const { mobile, desktop } = sources(slide);
          return (
            <div
              key={keyOf(slide)}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* <picture> y no next/image: hace falta art direction real,
                  que el navegador baje sólo el archivo del formato activo. */}
              <picture>
                <source media={DESKTOP_MEDIA} srcSet={desktop} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mobile}
                  alt={`Banner Rastro ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  decoding="async"
                  className="h-full w-full object-cover object-center"
                />
              </picture>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <div className="flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={keyOf(slide)}
              type="button"
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/45"
              }`}
            />
          ))}
        </div>
        <a
          href="#mas-vendidos"
          className="border border-white bg-white/95 px-5 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-[#222222] uppercase backdrop-blur transition hover:bg-white"
        >
          Ver más
        </a>
      </div>
    </section>
  );
}
