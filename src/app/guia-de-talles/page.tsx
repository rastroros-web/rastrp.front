"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";
import { SizeGuideTool } from "@/components/SizeGuideTool";
import AnimatedContent from "@/components/AnimatedContent";

function GuiaContent() {
  const params = useSearchParams();
  const brand = params.get("marca") ?? undefined;

  return (
    <main className="relative flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(ellipse_at_top,_rgba(86,49,40,0.12),_transparent_60%)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-16">
        <AnimatedContent distance={28} duration={0.7}>
          <nav className="mb-6 text-[10px] font-semibold tracking-[0.1em] text-soft uppercase md:mb-8 md:text-[11px]">
            <Link href="/" className="transition hover:text-[#222222]">
              Inicio
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#222222]">Guía de talles</span>
          </nav>
        </AnimatedContent>

        <AnimatedContent distance={36} duration={0.8} delay={0.05}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Más info
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-wide uppercase sm:text-5xl md:text-7xl">
            Guía de talles
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft md:text-lg">
            Calculá tu talle por marca y género, o mirá la tabla. Si dudás,
            escribinos por WhatsApp (341 351-5773) con la medida y el modelo.
          </p>
        </AnimatedContent>

        <div className="mt-10 space-y-8">
          <SizeGuideTool initialBrand={brand} />

          <section className="border border-black/5 bg-white p-5 md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Cómo medir
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-soft">
              <li>
                Apoyá el pie descalzo sobre una hoja, de pie y con el peso bien
                distribuido.
              </li>
              <li>Marcá el talón y la punta del dedo más largo.</li>
              <li>
                Medí en centímetros esa distancia: ese es el largo de plantilla.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function GuiaTallesPage() {
  return (
    <ShopChrome>
      <Suspense
        fallback={
          <main className="flex flex-1 items-center justify-center text-sm text-soft">
            Cargando guía…
          </main>
        }
      >
        <GuiaContent />
      </Suspense>
    </ShopChrome>
  );
}
