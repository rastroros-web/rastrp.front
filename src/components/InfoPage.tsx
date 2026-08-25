"use client";

import Link from "next/link";
import AnimatedContent from "@/components/AnimatedContent";
import { ShopChrome } from "@/components/ShopChrome";
import {
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/data/brand";

export type InfoSection = {
  title: string;
  body: string | string[];
};

export function InfoPage({
  eyebrow,
  title,
  lead,
  sections,
  aside,
  extra,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: InfoSection[];
  aside?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <ShopChrome>
      <main className="relative flex-1 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(ellipse_at_top,_rgba(86,49,40,0.12),_transparent_60%)]"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-16">
          <AnimatedContent distance={28} duration={0.7}>
            <nav className="mb-6 text-[10px] font-semibold tracking-[0.1em] text-soft uppercase md:mb-8 md:text-[11px] md:tracking-[0.12em]">
              <Link href="/" className="transition hover:text-[#222222]">
                Inicio
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[#222222]">{title}</span>
            </nav>
          </AnimatedContent>

          <AnimatedContent distance={36} duration={0.8} delay={0.05}>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-wide uppercase sm:text-5xl md:text-7xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft md:text-lg">
              {lead}
            </p>
          </AnimatedContent>

          {extra ? <div className="mt-8 max-w-xl">{extra}</div> : null}

          <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-10">
            <div className="space-y-4 md:space-y-6">
              {sections.map((section, i) => (
                <AnimatedContent
                  key={section.title}
                  distance={30}
                  duration={0.65}
                  delay={0.08 + i * 0.06}
                >
                  <article className="border border-black/5 bg-white/80 p-4 backdrop-blur-sm transition duration-300 hover:border-black/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] sm:p-6">
                    <h2 className="font-display text-xl font-bold tracking-wide uppercase sm:text-2xl">
                      {section.title}
                    </h2>
                    {Array.isArray(section.body) ? (
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-soft">
                        {section.body.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm leading-relaxed text-soft">
                        {section.body}
                      </p>
                    )}
                  </article>
                </AnimatedContent>
              ))}
            </div>

            <AnimatedContent distance={30} duration={0.7} delay={0.2}>
              <aside className="h-fit border border-black/5 bg-[#222222] p-5 text-white sm:p-6 lg:sticky lg:top-28">
                {aside ?? (
                  <>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase">
                      ¿Dudas?
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      Escribinos por WhatsApp o Instagram y te ayudamos con el
                      pedido, talles o envíos.
                    </p>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-press mt-6 inline-flex w-full items-center justify-center bg-white px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-[#222222] uppercase"
                    >
                      WhatsApp {WHATSAPP_DISPLAY}
                    </a>
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-press mt-3 inline-flex w-full items-center justify-center border border-white/30 px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition hover:bg-white/10"
                    >
                      Hablar por Instagram
                    </a>
                    <Link
                      href="/productos"
                      className="btn-press mt-3 inline-flex w-full items-center justify-center border border-white/30 px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition hover:bg-white/10"
                    >
                      Ver catálogo
                    </Link>
                  </>
                )}
              </aside>
            </AnimatedContent>
          </div>
        </div>
      </main>
    </ShopChrome>
  );
}
