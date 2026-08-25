"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AnimatedContent from "@/components/AnimatedContent";
import { ShopChrome } from "@/components/ShopChrome";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/data/brand";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  };

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
              <span className="text-[#222222]">Contacto</span>
            </nav>
          </AnimatedContent>

          <AnimatedContent distance={36} duration={0.8} delay={0.05}>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
              Hablemos
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-wide uppercase sm:text-5xl md:text-7xl">
              Contacto
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft md:text-lg">
              Consultas de talles, pedidos, envíos o cambios. Te respondemos lo
              antes posible — el canal más rápido es WhatsApp.
            </p>
          </AnimatedContent>

          <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
            <AnimatedContent distance={30} duration={0.7} delay={0.1}>
              <form
                onSubmit={onSubmit}
                className="border border-black/5 bg-white/80 p-4 backdrop-blur-sm sm:p-6"
              >
                <h2 className="font-display text-xl font-bold tracking-wide uppercase sm:text-2xl">
                  Escribinos
                </h2>
                <p className="mt-2 text-sm text-soft">
                  Completá el formulario o escribinos por WhatsApp — te
                  respondemos lo antes posible.
                </p>

                {sent ? (
                  <div className="mt-6 border border-[#16a34a]/25 bg-[#16a34a]/5 px-4 py-5">
                    <p className="text-sm font-semibold text-[#166534]">
                      ¡Gracias! Recibimos tu consulta.
                    </p>
                    <p className="mt-1 text-sm text-soft">
                      Mientras tanto, también podés escribirnos por WhatsApp{" "}
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand underline underline-offset-2"
                      >
                        {WHATSAPP_DISPLAY}
                      </a>{" "}
                      o Instagram {INSTAGRAM_HANDLE}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="link-press mt-4 text-[11px] font-semibold uppercase underline"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <label className="block text-sm">
                      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                        Nombre
                      </span>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Martina"
                        className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                        Email
                      </span>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ej: hola@email.com"
                        className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                        WhatsApp (opcional)
                      </span>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: +54 341 555-0199"
                        className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                        Mensaje
                      </span>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Contanos en qué te podemos ayudar…"
                        className="w-full resize-y border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn-press w-full bg-[#222222] px-4 py-3.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-black sm:w-auto sm:px-6"
                    >
                      Enviar mensaje
                    </button>
                  </div>
                )}
              </form>
            </AnimatedContent>

            <AnimatedContent distance={30} duration={0.7} delay={0.18}>
              <aside className="h-fit space-y-4 lg:sticky lg:top-28">
                <div className="border border-black/5 bg-[#222222] p-5 text-white sm:p-6">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase">
                    Canal rápido
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold tracking-wide uppercase">
                    WhatsApp
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Stock, talles, Mega Sale y seguimiento de pedidos: escribinos
                    al {WHATSAPP_DISPLAY}.
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press mt-6 inline-flex w-full items-center justify-center bg-white px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-[#222222] uppercase"
                  >
                    Abrir WhatsApp
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press mt-3 inline-flex w-full items-center justify-center border border-white/30 px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition hover:bg-white/10"
                  >
                    Instagram {INSTAGRAM_HANDLE}
                  </a>
                </div>

                <div className="border border-black/5 bg-white/80 p-5 backdrop-blur-sm sm:p-6">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-soft uppercase">
                    Más info
                  </p>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li>
                      <Link
                        href="/quienes-somos"
                        className="link-press font-medium uppercase tracking-wide"
                      >
                        Quiénes somos
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/envios"
                        className="transition hover:text-brand"
                      >
                        Envíos a todo el país
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/cambios"
                        className="transition hover:text-brand"
                      >
                        Cambios
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/guia-de-talles"
                        className="transition hover:text-brand"
                      >
                        Guía de talles
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/puntos-de-retiro"
                        className="transition hover:text-brand"
                      >
                        Puntos de retiro
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="border border-black/5 bg-white/80 p-5 text-sm text-soft backdrop-blur-sm sm:p-6">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#222222] uppercase">
                    Base
                  </p>
                  <p className="mt-3">Rosario, Santa Fe — Argentina</p>
                  <p className="mt-1">Envíos a todo el país</p>
                  <p className="mt-3">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand transition hover:opacity-80"
                    >
                      WhatsApp {WHATSAPP_DISPLAY}
                    </a>
                  </p>
                </div>
              </aside>
            </AnimatedContent>
          </div>
        </div>
      </main>
    </ShopChrome>
  );
}
