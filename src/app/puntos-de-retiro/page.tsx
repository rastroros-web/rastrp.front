"use client";

import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";
import AnimatedContent from "@/components/AnimatedContent";
import { STORES } from "@/lib/mock/stores";

export default function PuntosRetiroPage() {
  return (
    <ShopChrome>
      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(ellipse_at_top,_rgba(86,49,40,0.12),_transparent_60%)]"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-16">
          <AnimatedContent distance={28} duration={0.7}>
            <nav className="mb-6 text-[10px] font-semibold tracking-[0.1em] text-soft uppercase">
              <Link href="/" className="transition hover:text-[#222222]">
                Inicio
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[#222222]">Puntos de retiro</span>
            </nav>
          </AnimatedContent>

          <AnimatedContent distance={36} duration={0.8} delay={0.05}>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
              Más info
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-wide uppercase sm:text-5xl md:text-7xl">
              Puntos de retiro
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft md:text-lg">
              Retirá en Rosario sin costo de domicilio. El horario se coordina
              al confirmar tu pedido.
            </p>
          </AnimatedContent>

          <div className="mt-10 space-y-4">
            {STORES.map((store) => (
              <article
                key={store.id}
                className="border border-black/5 bg-white p-5"
              >
                <h2 className="font-display text-2xl font-bold tracking-wide uppercase">
                  {store.name}
                </h2>
                <p className="mt-1 text-sm">
                  {store.address}, {store.city}
                </p>
                <p className="mt-1 text-xs text-soft">{store.hours}</p>
                {store.phone ? (
                  <p className="text-xs text-soft">Tel {store.phone}</p>
                ) : null}
              </article>
            ))}
          </div>

          <p className="mt-8 text-sm text-soft">
            En checkout elegí{" "}
            <strong className="text-[#222222]">Punto de retiro</strong> y el
            local. Llevá DNI y el número de pedido.
          </p>
          <Link
            href="/checkout"
            className="btn-press mt-4 inline-flex bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
          >
            Ir al checkout
          </Link>
        </div>
      </main>
    </ShopChrome>
  );
}
