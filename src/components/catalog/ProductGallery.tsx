"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import { resolveMediaUrl } from "@/lib/api/backend";
import { useCallback, useEffect, useRef, useState } from "react";

function dedupeImages(images: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of images) {
    const url = src?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const unique = dedupeImages(images);
  const slides = unique.length ? unique : ["/assets/products/product-1.webp"];
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const go = useCallback(
    (next: number, direction: 1 | -1) => {
      const len = slides.length;
      setDir(direction);
      setIndex(((next % len) + len) % len);
      setAnimKey((k) => k + 1);
    },
    [slides.length]
  );

  const prev = useCallback(() => go(index - 1, -1), [go, index]);
  const next = useCallback(() => go(index + 1, 1), [go, index]);

  useEffect(() => {
    setIndex(0);
    setAnimKey((k) => k + 1);
  }, [slides.join("|")]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = (e.touches[0]?.clientX ?? 0) - touchStartX.current;
  };

  const onTouchEnd = () => {
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) prev();
    else next();
  };

  return (
    <div>
      <div
        className="relative aspect-[3/4] touch-pan-y overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={animKey}
          className={`absolute inset-0 ${
            dir === 1 ? "animate-gallery-next" : "animate-gallery-prev"
          }`}
        >
          <Image
            src={resolveMediaUrl(slides[index] ?? slides[0])}
            alt={`${alt} — foto ${index + 1}`}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 50vw"
            draggable={false}
          />
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute top-1/2 left-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center border border-black/10 bg-white/90 text-lg text-[#222222] shadow-sm transition hover:bg-white md:left-3 md:size-11"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Imagen siguiente"
              className="absolute top-1/2 right-2 z-10 flex size-10 -translate-y-1/2 items-center justify-center border border-black/10 bg-white/90 text-lg text-[#222222] shadow-sm transition hover:bg-white md:right-3 md:size-11"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir a imagen ${i + 1}`}
                  onClick={() => go(i, i > index ? 1 : -1)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-5 bg-[#222222]" : "w-1.5 bg-black/25"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {slides.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => go(i, i > index ? 1 : -1)}
              className={`relative aspect-square w-16 shrink-0 transition md:w-20 ${
                index === i
                  ? "border-2 border-[#222222]"
                  : "border border-black/10"
              }`}
            >
              <span className="absolute inset-0 overflow-hidden">
                <Image
                  src={resolveMediaUrl(src)}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              </span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
