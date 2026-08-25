"use client";

import Image from "next/image";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SiteHeader } from "@/components/SiteHeader";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import LogoLoop from "@/components/LogoLoop";
import BlurText from "@/components/BlurText";
import AnimatedContent from "@/components/AnimatedContent";
import FadeContent from "@/components/FadeContent";
import CountUp from "@/components/CountUp";
import ClickSpark from "@/components/ClickSpark";
import StarBorder from "@/components/StarBorder";
import PixelTransition from "@/components/PixelTransition";
import banners from "@/data/banners.json";
import { flattenCatalog } from "@/data/catalog";
import { useStore } from "@/components/store/StoreProvider";
import { BRAND, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/brand";
import { SiteFooter } from "@/components/SiteFooter";
import { PageEnter } from "@/components/PageEnter";
import { RecentlyViewedRail } from "@/components/RecentlyViewedRail";

const heroSlides = banners.slice(1, 4);
const promoTiles = banners.slice(4, 7);
const collectionBanners = banners.slice(7, 10);

/** Banners promo / colección → rutas de catálogo */
const promoLinks = ["/productos", "/productos", "/talles-bajos"] as const;
const collectionLinks = ["/talles-altos", "/samba", "/nike"] as const;

const brandLogos = [
  { node: <span className="text-lg font-bold tracking-[0.2em] uppercase md:text-2xl">Nike</span> },
  { node: <span className="text-lg font-bold tracking-[0.2em] uppercase md:text-2xl">Adidas</span> },
  { node: <span className="text-lg font-bold tracking-[0.2em] uppercase md:text-2xl">Vans</span> },
  { node: <span className="text-lg font-bold tracking-[0.2em] uppercase md:text-2xl">New Balance</span> },
  { node: <span className="text-lg font-bold tracking-[0.2em] uppercase md:text-2xl">Puma</span> },
  { node: <span className="text-lg font-bold tracking-[0.2em] uppercase md:text-2xl">Converse</span> },
];

const reviews = [
  {
    name: "Martina R.",
    text: "Compré online y llegó impecable. Los talles son reales y la atención súper clara. Ya quiero el próximo par.",
  },
  {
    name: "Lucas G.",
    text: "Mega Sale real. Samba y Dunk en un nivel de calidad que no esperaba a este precio. Recomiendo.",
  },
  {
    name: "Valentina S.",
    text: "Envío rápido y todo como en las fotos. La experiencia de compra fue fácil de punta a punta.",
  },
];

export default function Home() {
  const { products: shopProducts, ready } = useStore();
  const products = flattenCatalog(
    ready ? shopProducts.filter((p) => p.active !== false) : []
  );

  return (
    <ClickSpark sparkColor="#563128" sparkSize={12} sparkRadius={28} sparkCount={10} duration={500}>
      <main className="flex-1">
      <SiteHeader />

        <PageEnter className="overflow-x-hidden">
        <HeroCarousel slides={heroSlides} />

        <section id="marcas" className="border-b border-black/5 py-6 md:py-8">
          <LogoLoop
            logos={brandLogos}
            speed={80}
            direction="left"
            logoHeight={28}
            gap={48}
            pauseOnHover
            fadeOut
            fadeOutColor="#ffffff"
            scaleOnHover
            ariaLabel="Marcas Rastro"
          />
        </section>

        <section className="mx-auto grid max-w-7xl gap-2 px-4 py-5 sm:gap-3 sm:py-6 md:grid-cols-3 md:px-6 md:py-10">
          {promoTiles.map((src, i) => (
            <AnimatedContent
              key={src}
              distance={50}
              direction="vertical"
              delay={0.1 * i}
              duration={0.8}
            >
              <a
                href={promoLinks[i] ?? "/productos"}
                className="group relative block aspect-[1024/1135] overflow-hidden"
              >
                <PixelTransition
                  firstContent={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={`Promo ${i + 1}`} className="h-full w-full object-contain" />
                  }
                  secondContent={
                    <div className="flex h-full w-full items-center justify-center bg-[#222222] text-center">
                      <span className="font-display text-3xl font-bold tracking-[0.2em] text-white uppercase">
                        Ver más
                      </span>
                    </div>
                  }
                  gridSize={10}
                  pixelColor="#563128"
                  animationStepDuration={0.35}
                  aspectRatio="110.84%"
                  className="h-full w-full !rounded-none !border-0 !bg-transparent"
                />
              </a>
            </AnimatedContent>
          ))}
        </section>

        <section id="mas-vendidos" className="mx-auto max-w-7xl px-4 py-7 md:px-6 md:py-14">
          <div className="mb-7 flex flex-col items-center text-center md:mb-10">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
              Favoritos
            </p>
            <BlurText
              text="¡Lo más vendido!"
              delay={80}
              animateBy="words"
              direction="top"
              className="justify-center font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-6xl"
            />
            <Link
              href="/productos"
              className="mt-4 text-[11px] font-semibold tracking-[0.16em] uppercase underline-offset-4 hover:underline"
            >
              Ver catálogo completo
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3 sm:gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
            {products.slice(0, 12).map((product, index) => (
              <ProductCard
                key={`${product.slug}-${product.variantId}`}
                product={product}
                index={index}
              />
            ))}
          </div>
        </section>

        <section className="border-y border-black/5 bg-[#f5f4f0]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-center md:grid-cols-3 md:px-6 md:py-14">
            <FadeContent blur duration={900} delay={0}>
              <h3 className="font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl md:text-5xl">
                <CountUp to={25} duration={1.5} />% OFF
              </h3>
              <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-soft uppercase">
                Abonando por transferencia bancaria
              </p>
            </FadeContent>
            <FadeContent blur duration={900} delay={0.15}>
              <h3 className="font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl md:text-5xl">
                Envíos
              </h3>
              <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-soft uppercase">
                A todo el país · retiro en puntos
              </p>
            </FadeContent>
            <FadeContent blur duration={900} delay={0.3}>
              <h3 className="font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl md:text-5xl">
                <CountUp to={3} duration={1.2} /> cuotas
              </h3>
              <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-soft uppercase">
                Sin interés con tarjetas bancarizadas
              </p>
            </FadeContent>
          </div>
        </section>

        <RecentlyViewedRail />

        <section id="coleccion" className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16">
          <div className="mb-8 flex flex-col items-center text-center">
            <BlurText
              text="Nueva colección"
              delay={60}
              animateBy="words"
              className="justify-center font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl"
            />
            <p className="mt-2 text-sm text-soft">Descubrí lo nuevo de la temporada</p>
          </div>
          <div className="grid gap-2 sm:gap-3 md:grid-cols-3">
            {collectionBanners.map((src, i) => (
              <AnimatedContent key={src} distance={60} delay={0.12 * i} direction="vertical">
                <a
                  href={collectionLinks[i] ?? "/productos"}
                  className="group relative block aspect-[3/4] overflow-hidden bg-[#f5f4f0] [transform:translateZ(0)] transition-transform duration-300 ease-out will-change-transform hover:z-10 hover:scale-[1.025]"
                >
                  <Image
                    src={src}
                    alt={`Colección Rastro ${i + 1}`}
                    fill
                    className="object-contain [backface-visibility:hidden]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/70" />
                  <span className="absolute inset-x-0 bottom-0 flex justify-center p-5">
                    <span className="relative inline-flex items-center justify-center overflow-hidden border border-white px-4 py-2.5 text-[11px] font-bold tracking-[0.18em] text-white uppercase backdrop-blur-sm transition-[border-color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:border-brand">
                      <span
                        aria-hidden
                        className="absolute inset-0 origin-left scale-x-0 bg-brand transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                      />
                      <span className="relative z-10">Ver nueva colección</span>
                    </span>
                  </span>
                </a>
              </AnimatedContent>
            ))}
          </div>
        </section>

        <section className="bg-[#222222] text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="mb-8 flex justify-center">
              <BlurText
                text="Reseñas"
                delay={70}
                animateBy="letters"
                className="justify-center font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl"
              />
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              {reviews.map((review, i) => (
                <AnimatedContent key={review.name} distance={40} delay={0.1 * i}>
                  <blockquote className="border border-white/15 p-5 transition hover:border-brand sm:p-6">
                    <p className="text-sm leading-relaxed text-white/85">&ldquo;{review.text}&rdquo;</p>
                    <footer className="mt-4 text-xs font-semibold tracking-[0.14em] text-brand uppercase">
                      — {review.name}
                    </footer>
                  </blockquote>
                </AnimatedContent>
              ))}
            </div>
          </div>
        </section>

        <section id="instagram" className="border-y border-black/5 bg-[#f5f4f0]">
          <div className="mx-auto max-w-4xl px-4 py-12 text-center md:px-6 md:py-16">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
              Seguinos
            </p>
            <BlurText
              text="RASTRO | Zapatillas"
              delay={60}
              animateBy="words"
              className="justify-center font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl md:text-5xl"
            />
            <p className="mx-auto mt-4 max-w-xl text-sm text-soft md:text-base">
              ⚡️ {BRAND.bio} ⚡️
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-semibold tracking-[0.1em] text-[#222222] uppercase sm:gap-x-4 sm:text-xs sm:tracking-[0.12em]">
              {BRAND.highlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
              <FadeContent blur duration={800}>
                <p className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
                  <CountUp to={BRAND.posts} duration={1.4} />
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-soft uppercase sm:text-[11px] sm:tracking-[0.14em]">
                  Publicaciones
                </p>
              </FadeContent>
              <FadeContent blur duration={800} delay={0.1}>
                <p className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
                  <CountUp to={BRAND.followers} duration={1.8} separator="." />
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-soft uppercase sm:text-[11px] sm:tracking-[0.14em]">
                  Seguidores
                </p>
              </FadeContent>
              <FadeContent blur duration={800} delay={0.2}>
                <p className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
                  <CountUp to={BRAND.following} duration={1.2} />
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-soft uppercase sm:text-[11px] sm:tracking-[0.14em]">
                  Seguidos
                </p>
              </FadeContent>
            </div>

            <div className="mt-8 flex justify-center">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center justify-center bg-[#222222] px-6 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition hover:bg-black sm:px-8 sm:py-3.5 sm:text-xs sm:tracking-[0.16em]"
              >
                Seguir {INSTAGRAM_HANDLE}
              </a>
            </div>
          </div>
        </section>

        <section id="newsletter" className="mx-auto max-w-3xl px-4 py-12 text-center md:px-6 md:py-16">
          <BlurText
            text="Registrate y obtené un descuento"
            delay={50}
            animateBy="words"
            className="justify-center font-display text-2xl font-bold tracking-wide uppercase sm:text-3xl md:text-5xl"
          />
          <p className="mt-3 text-sm text-soft">Suscribite y recibí las últimas novedades de Rastro</p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Tu email"
              className="w-full border border-black/15 px-4 py-3 text-sm outline-none focus:border-[#222222]"
            />
            <StarBorder
              as="button"
              type="submit"
              color="#563128"
              speed="4s"
              thickness={2}
              className="btn-press shrink-0 bg-[#222222] px-6 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase"
            >
              Suscribirme
            </StarBorder>
          </form>
        </section>

        </PageEnter>
        <SiteFooter />
      </main>
    </ClickSpark>
  );
}
