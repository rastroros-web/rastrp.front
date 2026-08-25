"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import type { ProductCardModel } from "@/data/catalog";
import { isMegaSale, megaSalePercentOf, pricedForMegaSale, variantCover } from "@/data/catalog";
import { resolveMediaUrl } from "@/lib/api/backend";

export type Product = ProductCardModel;

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductCardModel;
  index?: number;
}) {
  const { toggleWishlist, isWishlisted, getProduct, ready } = useStore();
  const wishlisted = ready && isWishlisted(product.slug);
  const live = ready ? getProduct(product.slug) : undefined;
  const variant = live?.variants.find((v) => v.id === product.variantId);
  const salePercent = variant?.salePercent;
  const source = live ?? product;
  const megaSale = isMegaSale(source);
  const megaPercent = megaSalePercentOf(source);
  const priced =
    live && variant
      ? pricedForMegaSale(variant.price, variant.transfer, live)
      : null;
  const displayPrice = priced?.price ?? product.price;
  const displayTransfer = priced?.transfer ?? product.transfer;
  const displayInstallments = priced?.installments ?? product.installments;
  const compareAt = priced?.active
    ? priced.original
    : product.compareAtPrice;
  const until = priced?.until ?? product.megaSaleUntil;
  const imageSrc = resolveMediaUrl(
    (variant ? variantCover(variant) : "") || product.local
  );

  return (
    <div
      className="h-full animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
    >
      <article className="group relative flex h-full flex-col [transform:translateZ(0)] transition-transform duration-300 ease-out will-change-transform md:hover:z-10 md:hover:scale-[1.025]">
        <div className="relative">
          <Link
            href={product.href}
            className="relative block overflow-hidden bg-transparent"
          >
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-contain p-2 md:p-3 [backface-visibility:hidden]"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>

            <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 flex flex-col gap-1 md:left-2 md:top-2">
              {product.liquidacion ? (
                <span className="bg-brand px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase md:px-2 md:py-1 md:text-[10px]">
                  Liquidación
                </span>
              ) : megaSale ? (
                <span className="bg-brand px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase md:px-2 md:py-1 md:text-[10px]">
                  Sale{megaPercent ? ` −${megaPercent}%` : ""}
                </span>
              ) : salePercent != null && salePercent > 0 ? (
                <span className="bg-brand px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase md:px-2 md:py-1 md:text-[10px]">
                  Sale −{salePercent}%
                </span>
              ) : null}
            </div>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.slug);
            }}
            aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
            className={`absolute top-1.5 right-1.5 z-20 flex size-8 items-center justify-center border bg-cream/90 transition md:top-2 md:right-2 ${
              wishlisted
                ? "border-brand text-brand"
                : "border-black/10 text-[#222222] hover:border-brand hover:text-brand"
            }`}
          >
            <Heart
              className="size-3.5"
              fill={wishlisted ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>
        </div>

        <div className="relative flex flex-1 flex-col px-0.5 pt-2.5 md:px-1 md:pt-3">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-soft uppercase md:text-[10px] md:tracking-[0.16em]">
            {product.brand}
          </p>
          <Link href={product.href}>
            <h3 className="mt-1 text-[12px] font-medium leading-snug tracking-wide uppercase line-clamp-2 md:text-[13px]">
              {product.name}
            </h3>
          </Link>

          {product.colors.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5">
              {product.colors.map((c) => (
                <Link
                  key={c.id}
                  href={`/productos/${product.slug}?color=${c.id}`}
                  title={c.name}
                  className="size-3 rounded-full border border-black/15 transition hover:scale-110 md:size-3.5"
                  style={{ backgroundColor: c.color }}
                  aria-label={`Color ${c.name}`}
                />
              ))}
            </div>
          )}

          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold md:text-sm">
            {compareAt && (
              <span className="text-[11px] font-medium text-soft line-through md:text-xs">
                {compareAt}
              </span>
            )}
            <span>{displayPrice}</span>
          </p>
          {megaSale && until ? (
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-brand md:text-[11px]">
              Hasta el {until}
            </p>
          ) : null}
          <p className="mt-0.5 min-h-[1.1rem] text-[11px] font-medium leading-snug text-[#16a34a] md:text-xs">
            <span className="md:hidden">{displayTransfer} transf.</span>
            <span className="hidden md:inline">
              {displayTransfer} con Transferencia
            </span>
          </p>
          <p className="mt-0.5 min-h-[1.1rem] text-[11px] font-medium text-brand md:text-xs">
            {displayInstallments
              ? `3 cuotas de ${displayInstallments}`
              : "\u00A0"}
          </p>
          <div className="mt-auto w-full pt-2.5 md:pt-3">
            <Link
              href={product.href}
              className="product-cta group/cta relative flex w-full items-center justify-center overflow-hidden border border-[#222222] bg-[#222222] px-2 py-2 text-[10px] font-semibold tracking-[0.1em] text-white uppercase md:px-3 md:py-2.5 md:text-[11px] md:tracking-[0.14em]"
            >
              <span
                aria-hidden
                className="absolute inset-0 origin-left scale-x-0 bg-brand transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:scale-x-100"
              />
              <span className="relative z-10 transition-colors duration-300 group-hover/cta:text-white">
                Ver producto
              </span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
