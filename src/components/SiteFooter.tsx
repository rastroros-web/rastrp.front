import Image from "next/image";
import Link from "next/link";
import {
  BRAND,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/data/brand";
import { storeCategoryRoutes } from "@/data/catalog";

const HELP_LINKS = [
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/contacto", label: "Contacto" },
  { href: "/faq", label: "FAQ" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/guia-de-talles", label: "Guía de talles" },
  { href: "/cambios", label: "Cambios y garantía" },
  { href: "/envios", label: "Envíos" },
  { href: "/puntos-de-retiro", label: "Puntos de retiro" },
] as const;

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#f0f0f0]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:gap-10 md:grid-cols-12 md:gap-8 md:px-6 md:py-14">
        <div className="col-span-2 md:col-span-3">
          <Image
            src="/assets/logo/rastro-logo.webp"
            alt="Rastro"
            width={120}
            height={40}
            className="h-9 w-auto object-contain brightness-0 md:h-10"
          />
          <p className="mt-4 max-w-xs text-sm text-soft">{BRAND.bio}.</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-brand transition hover:opacity-80"
            >
              WhatsApp {WHATSAPP_DISPLAY}
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-brand transition hover:opacity-80"
            >
              {INSTAGRAM_HANDLE}
            </a>
          </div>
          <Image
            src="/assets/logo/rastro-footer.png"
            alt=""
            width={180}
            height={64}
            className="mt-6 h-12 w-auto object-contain opacity-90 md:h-14"
            aria-hidden
          />
        </div>

        <div className="md:col-span-3 md:col-start-5">
          <h4 className="mb-3 text-xs font-bold tracking-[0.16em] uppercase">
            Shop
          </h4>
          <ul className="space-y-2 text-sm text-soft">
            {storeCategoryRoutes.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link href={c.href} className="transition hover:text-[#222222]">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="mb-3 text-xs font-bold tracking-[0.16em] uppercase">
            Ayuda
          </h4>
          <ul className="space-y-2 text-sm text-soft">
            {HELP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#222222]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 md:hidden">
            <h4 className="mb-3 text-xs font-bold tracking-[0.16em] uppercase">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-soft">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-[#222222]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hidden md:col-span-2 md:block">
          <h4 className="mb-3 text-xs font-bold tracking-[0.16em] uppercase">
            Legal
          </h4>
          <ul className="space-y-2 text-sm text-soft">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-[#222222]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-black/10 px-4 py-4 text-center text-[11px] leading-relaxed text-soft md:text-xs">
        Copyright Rastro — 2026. Todos los derechos reservados.
        {" · "}
        {LEGAL_LINKS.map((l, i) => (
          <span key={l.href}>
            {i > 0 ? " · " : null}
            <Link href={l.href} className="underline underline-offset-2">
              {l.label}
            </Link>
          </span>
        ))}
      </div>
    </footer>
  );
}
