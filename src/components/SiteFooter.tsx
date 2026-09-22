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
          <div className="mt-4 flex flex-col gap-2.5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Hablame por WhatsApp ${WHATSAPP_DISPLAY}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#222222] transition hover:text-brand"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 shrink-0"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hablame por WhatsApp
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Hablame por Instagram ${INSTAGRAM_HANDLE}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#222222] transition hover:text-brand"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0"
                aria-hidden
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Hablame por Instagram
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
