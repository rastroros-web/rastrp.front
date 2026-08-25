"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { AdBar } from "@/components/AdBar";
import { SearchModal } from "@/components/SearchModal";
import { StaggeredMenu } from "@/components/StaggeredMenu";
import { useStore } from "@/components/store/StoreProvider";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/data/brand";
import { storeCategoryRoutes } from "@/data/catalog";

const NAV_HIDDEN = new Set([
  "vans",
  "new-balance",
  "converse",
  "summer",
  "samba",
  "talles-bajos",
  "talles-altos",
]);

const NAV = storeCategoryRoutes
  .filter((c) => !NAV_HIDDEN.has(c.slug))
  .map((c) => ({
    label: c.label,
    ariaLabel: c.label,
    link: c.href,
  }));

const EXTRA_NAV = [
  { label: "Favoritos", ariaLabel: "Favoritos", link: "/favoritos" },
  { label: "Quiénes somos", ariaLabel: "Quiénes somos", link: "/quienes-somos" },
  { label: "Contacto", ariaLabel: "Contacto", link: "/contacto" },
  { label: "FAQ", ariaLabel: "FAQ", link: "/faq" },
  { label: "Carrito", ariaLabel: "Carrito", link: "/carrito" },
  { label: "Cuenta", ariaLabel: "Cuenta", link: "/cuenta" },
];

function lockBodyScroll() {
  const y = window.scrollY;
  document.body.dataset.scrollLockY = String(y);
  document.body.style.position = "fixed";
  document.body.style.top = `-${y}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.documentElement.style.overflow = "hidden";
}

function unlockBodyScroll() {
  const y = Number(document.body.dataset.scrollLockY || 0);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.documentElement.style.overflow = "";
  delete document.body.dataset.scrollLockY;
  window.scrollTo(0, y);
}

export function SiteHeader() {
  const { cartCount, session, wishlist } = useStore();
  const mobileItems = [...NAV, ...EXTRA_NAV];
  const accountHref = session ? "/cuenta" : "/cuenta/login";
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    return () => {
      unlockBodyScroll();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleMenuOpen = () => {
    setMenuOpen(true);
    lockBodyScroll();
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
    unlockBodyScroll();
  };

  return (
    <div className="sticky top-0 z-[60]">
      <AdBar />

      <div
        className={`relative border-b border-black/5 bg-white md:hidden ${
          menuOpen ? "z-[70]" : ""
        }`}
      >
        <StaggeredMenu
          position="right"
          isFixed={false}
          colors={["#222222", "#222222", "#333333"]}
          items={mobileItems}
          socialItems={[
            { label: "WhatsApp", link: WHATSAPP_URL },
            { label: "Instagram", link: INSTAGRAM_URL },
            { label: "@rastro.ros", link: INSTAGRAM_URL },
          ]}
          displaySocials
          displayItemNumbering={false}
          logoUrl="/assets/logo/rastro-logo.webp"
          menuButtonColor="#222222"
          openMenuButtonColor="#222222"
          accentColor="#563128"
          changeMenuColorOnOpen={false}
          closeOnClickAway
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
        />
        <div
          className={`absolute top-1/2 right-11 z-[110] flex -translate-y-1/2 items-center gap-3 transition-opacity ${
            menuOpen ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="text-[#222222]"
            aria-label="Buscar"
          >
            <Search className="size-4" />
          </button>
          <Link href="/favoritos" className="relative text-[#222222]" aria-label="Favoritos">
            <Heart className="size-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center bg-brand text-[9px] font-bold text-white">
                {wishlist.length > 9 ? "9+" : wishlist.length}
              </span>
            )}
          </Link>
          <Link href={accountHref} className="text-[#222222]" aria-label="Cuenta">
            <User className="size-4" />
          </Link>
          <Link href="/carrito" className="relative text-[#222222]" aria-label="Carrito">
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center bg-brand text-[9px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <header className="hidden border-b border-black/5 bg-white/90 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <nav className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-2 lg:gap-x-4">
            {NAV.slice(0, 5).map((item) => (
              <Link
                key={item.label}
                href={item.link}
                className="text-[10px] font-semibold tracking-[0.12em] text-[#222222] uppercase transition hover:text-brand lg:text-[11px] lg:tracking-[0.14em]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className="shrink-0">
            <Image
              src="/assets/logo/rastro-logo.webp"
              alt="Rastro"
              width={140}
              height={48}
              className="h-10 w-auto object-contain brightness-0 lg:h-12"
              priority
            />
          </Link>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-2 lg:gap-x-4">
            <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 lg:gap-x-4">
              {NAV.slice(5).map((item) => (
                <Link
                  key={item.label}
                  href={item.link}
                  className="text-[10px] font-semibold tracking-[0.12em] text-[#222222] uppercase transition hover:text-brand lg:text-[11px] lg:tracking-[0.14em]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="text-[#222222] transition hover:text-brand"
              aria-label="Buscar"
              title="Buscar (⌘K)"
            >
              <Search className="size-4" />
            </button>
            <Link
              href="/favoritos"
              className="relative text-[#222222] transition hover:text-brand"
              aria-label="Favoritos"
            >
              <Heart className="size-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center bg-brand text-[9px] font-bold text-white">
                  {wishlist.length > 9 ? "9+" : wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href={accountHref}
              className="text-[#222222] transition hover:text-brand"
              aria-label="Cuenta"
            >
              <User className="size-4" />
            </Link>
            <Link
              href="/carrito"
              className="relative text-[#222222] transition hover:text-brand"
              aria-label="Carrito"
            >
              <ShoppingBag className="size-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center bg-brand text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
