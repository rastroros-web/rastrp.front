"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Share2, ShoppingBag } from "lucide-react";
import type { CatalogProduct } from "@/data/catalog";
import {
  flattenCatalog,
  uniqueCardsBySlug,
  getVariant,
  pricedForMegaSale,
  isLiquidacion,
  stripSizeChartImages,
} from "@/data/catalog";
import { resolveMediaUrl } from "@/lib/api/backend";
import { ProductDescription } from "@/components/catalog/ProductDescription";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ShippingQuote } from "@/components/catalog/ShippingQuote";
import { ProductCard } from "@/components/ProductCard";
import { CartToast, type CartToastPayload } from "@/components/CartToast";
import { useStore } from "@/components/store/StoreProvider";
import { sizeQty, stockLabelFromSizes } from "@/lib/mock/stock";
import { productSharePayload } from "@/lib/shareProduct";

function scrollToProductImage() {
  const el = document.getElementById("producto");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function ProductDetail({
  product,
  initialColor,
}: {
  product: CatalogProduct;
  initialColor?: string;
}) {
  const {
    addToCart,
    getProduct,
    ready,
    toggleWishlist,
    isWishlisted,
    trackView,
    recentlyViewed,
    products,
  } = useStore();
  const live = ready ? getProduct(product.slug) : undefined;
  const activeProduct = live ?? product;
  const wishlisted = ready && isWishlisted(activeProduct.slug);
  const [colorId, setColorId] = useState(
    initialColor && activeProduct.variants.some((v) => v.id === initialColor)
      ? initialColor
      : activeProduct.variants[0].id
  );
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [notifySize, setNotifySize] = useState<string | null>(null);
  const [toast, setToast] = useState<CartToastPayload | null>(null);
  const [shared, setShared] = useState(false);
  const skipInitialScroll = useRef(true);

  const variant = useMemo(
    () => getVariant(activeProduct, colorId),
    [activeProduct, colorId]
  );
  const priced = useMemo(
    () => pricedForMegaSale(variant.price, variant.transfer, activeProduct),
    [variant.price, variant.transfer, activeProduct]
  );
  const images = useMemo(() => {
    const list = stripSizeChartImages(
      variant.images?.length ? variant.images : [variant.image]
    )
      .map((src) => resolveMediaUrl(String(src || "").trim()))
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [variant]);

  const showColorPicker = activeProduct.variants.length > 1;
  const stockInfo = stockLabelFromSizes(variant.sizes);
  const selectedStock = size
    ? sizeQty(variant.sizes.find((s) => s.label === size) ?? { stock: 0 })
    : null;

  const recentItems = useMemo(() => {
    if (!ready) return [];
    const source = products.filter((p) => p.active !== false);
    return uniqueCardsBySlug(
      flattenCatalog(source).filter(
        (p) =>
          recentlyViewed.includes(p.slug) && p.slug !== activeProduct.slug
      )
    ).slice(0, 4);
  }, [ready, products, recentlyViewed, activeProduct.slug]);

  const relatedItems = useMemo(() => {
    if (!ready) return [];
    const source = products.filter((p) => p.active !== false);
    return uniqueCardsBySlug(
      flattenCatalog(source).filter(
        (p) =>
          p.brand === activeProduct.brand && p.slug !== activeProduct.slug
      )
    ).slice(0, 4);
  }, [ready, products, activeProduct.brand, activeProduct.slug]);

  useEffect(() => {
    if (!ready) return;
    trackView(activeProduct.slug);
  }, [ready, activeProduct.slug, trackView]);

  useEffect(() => {
    scrollToProductImage();
  }, [activeProduct.slug]);

  useEffect(() => {
    if (skipInitialScroll.current) {
      skipInitialScroll.current = false;
      return;
    }
    scrollToProductImage();
  }, [colorId]);

  const closeToast = useCallback(() => setToast(null), []);

  const selectColor = (id: string) => {
    if (id === colorId) return;
    setColorId(id);
    setSize(null);
    setAdded(false);
    // Evita refetch RSC / remount del PDP en producción
    window.history.replaceState(
      null,
      "",
      `/productos/${activeProduct.slug}?color=${encodeURIComponent(id)}`
    );
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/productos/${activeProduct.slug}?color=${encodeURIComponent(variant.id)}`;
    const payload = productSharePayload({
      name: activeProduct.name,
      variantName: variant.name,
      showVariant: showColorPicker,
      price: priced.price,
      transfer: priced.transfer,
      installments: priced.installments,
      url,
    });
    const markCopied = () => {
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        markCopied();
        return;
      }
      await navigator.clipboard.writeText(payload.full);
      markCopied();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(payload.full);
        markCopied();
      } catch {
        /* ignore */
      }
    }
  };

  const handleAdd = () => {
    if (!size) return;
    addToCart({
      productSlug: activeProduct.slug,
      productName: activeProduct.name,
      brand: activeProduct.brand,
      variantId: variant.id,
      variantName: variant.name,
      size,
      price: priced.price,
      transfer: priced.transfer,
      listPrice: priced.active ? priced.price : priced.original,
      image: variant.image,
    });
    setAdded(true);
    setToast({
      productName: activeProduct.name,
      brand: activeProduct.brand,
      size,
      image: variant.image,
      variantName: variant.name,
    });
  };

  const addLabel = added ? (
    <>
      <Check className="size-4" strokeWidth={2.5} />
      Agregado al carrito
    </>
  ) : (
    <>
      <ShoppingBag className="size-4" />
      Agregar al carrito
    </>
  );

  const addLabelMobile = added ? (
    <>
      <Check className="size-3.5" strokeWidth={2.5} />
      Agregado
    </>
  ) : size ? (
    <>
      <ShoppingBag className="size-3.5" />
      Agregar
    </>
  ) : (
    "Elegí talle"
  );

  return (
    <div
      id="producto"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-6 pb-28 md:px-6 md:py-12 md:pb-12"
    >
      <nav className="mb-4 truncate text-[10px] font-semibold tracking-[0.1em] text-soft uppercase md:mb-6 md:text-[11px] md:tracking-[0.12em]">
        <Link href="/" className="transition hover:text-[#222222]">
          Inicio
        </Link>
        <span className="mx-1.5 md:mx-2">/</span>
        <Link href="/productos" className="transition hover:text-[#222222]">
          Catálogo
        </Link>
        <span className="mx-1.5 md:mx-2">/</span>
        <span className="text-[#222222]">{activeProduct.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          key={`${activeProduct.slug}-${variant.id}`}
          images={images}
          alt={`${activeProduct.name} ${variant.name}`}
        />

        <div className="flex flex-col">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            {activeProduct.brand}
          </p>
          {priced.active ? (
            <div className="mt-2">
              <span className="inline-block w-fit bg-brand px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] text-white uppercase">
                Mega Sale
                {priced.percent ? ` −${priced.percent}%` : ""}
              </span>
              {priced.until ? (
                <p className="mt-1.5 text-xs font-medium text-brand">
                  Hasta el {priced.until}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
              {activeProduct.name}
            </h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleWishlist(activeProduct.slug)}
                className={`chip-press flex size-10 items-center justify-center border ${
                  wishlisted
                    ? "border-brand text-brand"
                    : "border-black/15 text-[#222222]"
                }`}
                aria-label="Favorito"
              >
                <Heart
                  className="size-4"
                  fill={wishlisted ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="chip-press flex size-10 items-center justify-center border border-black/15 text-[#222222]"
                aria-label={shared ? "Mensaje copiado" : "Compartir"}
              >
                {shared ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <Share2 className="size-4" />
                )}
              </button>
            </div>
          </div>
          {showColorPicker && (
            <p className="mt-1 text-sm text-soft">{variant.name}</p>
          )}

          <div className="mt-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {isLiquidacion(activeProduct) && (
                <span className="bg-brand px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] text-white uppercase">
                  Liquidación
                </span>
              )}
              {!priced.active &&
                variant.salePercent != null &&
                variant.salePercent > 0 && (
                  <span className="bg-brand px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] text-white uppercase">
                    Sale −{variant.salePercent}%
                  </span>
                )}
              {(priced.active ? priced.original : variant.compareAtPrice) && (
                <p className="text-sm text-soft line-through">
                  {priced.active ? priced.original : variant.compareAtPrice}
                </p>
              )}
            </div>
            <p className="mt-1 text-xl font-semibold md:text-2xl">
              {priced.price}
            </p>
            <p className="mt-1 text-sm font-medium text-[#16a34a]">
              {priced.transfer} con Transferencia bancaria / Depósito
            </p>
            <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-soft uppercase">
              25% de descuento pagando con Transferencia bancaria / Depósito
            </p>
            {(priced.installments ||
              variant.installmentsLabel ||
              variant.installments) && (
              <p className="mt-1 text-sm font-medium text-brand">
                {priced.installments
                  ? `3 cuotas de ${priced.installments}`
                  : variant.installmentsLabel}
              </p>
            )}
          </div>

          {showColorPicker && (
            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase">
                  Color
                </p>
                <p className="truncate text-xs text-soft">
                  {variant.name}
                  {variant.salePercent
                    ? ` · −${variant.salePercent}%`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeProduct.variants.map((v) => {
                  const selected = v.id === colorId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectColor(v.id)}
                      title={
                        v.salePercent
                          ? `${v.name} (−${v.salePercent}%)`
                          : v.name
                      }
                      aria-label={`Color ${v.name}`}
                      aria-pressed={selected}
                      className={`chip-press group flex items-center gap-2 border px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                        selected
                          ? "border-[#222222] bg-[#222222] text-white"
                          : "border-black/15 bg-white text-[#222222] hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                      }`}
                    >
                      <span
                        className={`size-3.5 shrink-0 rounded-full ring-1 ring-inset ${
                          selected
                            ? "ring-white/55"
                            : "ring-black/25 group-hover:ring-white/55"
                        }`}
                        style={{ backgroundColor: v.color }}
                      />
                      <span className="truncate">{v.name}</span>
                      {v.salePercent != null && v.salePercent > 0 && (
                        <span
                          className={`text-[10px] font-bold tracking-wide ${
                            selected
                              ? "text-[#8a5a4a]"
                              : "text-brand group-hover:text-[#8a5a4a]"
                          }`}
                        >
                          −{v.salePercent}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase">
                Talle
              </p>
              <a
                href={`/guia-de-talles?marca=${encodeURIComponent(activeProduct.brand)}`}
                className="text-[11px] font-semibold tracking-[0.12em] text-soft uppercase underline-offset-2 hover:underline"
              >
                Guía de talles
              </a>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {variant.sizes.map((s) => {
                const selected = size === s.label;
                const qty = sizeQty(s);
                const out = qty <= 0;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      if (out) {
                        setNotifySize(s.label);
                        window.setTimeout(() => setNotifySize(null), 2800);
                        return;
                      }
                      setSize(s.label);
                      setAdded(false);
                    }}
                    className={`chip-press relative px-2 py-3 text-sm font-semibold ${
                      out
                        ? "cursor-pointer bg-[#f0f0f0] text-soft line-through hover:bg-[#e8e8e8]"
                        : selected
                          ? "bg-[#222222] text-white"
                          : "border border-black/15 bg-white text-[#222222] hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                    }`}
                    title={
                      out
                        ? "Avisarme cuando haya stock"
                        : `${qty} unidad${qty === 1 ? "" : "es"}`
                    }
                  >
                    {s.label}
                    {!out && qty <= 3 && (
                      <span
                        className={`absolute -right-1 -top-1 flex size-4 items-center justify-center text-[8px] font-bold ${
                          selected
                            ? "bg-brand text-white"
                            : "bg-[#222222] text-white"
                        }`}
                      >
                        {qty}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {notifySize && (
              <p className="mt-2 text-xs font-medium text-[#16a34a]">
                Te avisamos cuando el talle {notifySize} vuelva.
              </p>
            )}
            {!size && !notifySize && (
              <p className="mt-2 text-xs text-soft">
                Elegí un talle · tocá un agotado para “avisarme”
              </p>
            )}
            {selectedStock != null && selectedStock > 0 && selectedStock <= 5 && (
              <p className="mt-2 text-xs font-semibold text-brand uppercase tracking-wide">
                Quedan {selectedStock} en talle {size}
              </p>
            )}
            {stockInfo?.tone === "out" && (
              <p className="mt-2 text-xs font-semibold text-red-600 uppercase tracking-wide">
                Sin stock en este color
              </p>
            )}
          </div>

          <div className="mt-8 hidden flex-col gap-3 md:flex">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!size}
              className={`btn-press add-cart-btn flex w-full items-center justify-center gap-2 px-6 py-4 text-[12px] font-semibold tracking-[0.16em] text-white uppercase ${
                added
                  ? "add-cart-btn-success"
                  : "bg-[#222222] hover:bg-black disabled:cursor-not-allowed disabled:bg-black/30"
              }`}
            >
              <span className="inline-flex items-center gap-2">{addLabel}</span>
            </button>
            <a
              href="https://www.instagram.com/rastro.ros/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press border border-[#222222] px-6 py-3.5 text-center text-[12px] font-semibold tracking-[0.16em] uppercase hover:bg-[#222222] hover:text-white"
            >
              Consultar por Instagram
            </a>
          </div>

          <div className="mt-8">
            <ShippingQuote />
          </div>

          <ProductDescription text={activeProduct.description} />

          <ul className="mt-10 space-y-2 border-t border-black/5 pt-6 text-xs text-soft">
            <li>
              Cambios disponibles según política de la tienda —{" "}
              <Link href="/cambios" className="underline underline-offset-2">
                ver detalle
              </Link>
            </li>
            <li>
              <Link href="/envios" className="underline underline-offset-2">
                Envío a todo el país
              </Link>
              {" · "}
              Rosario: comprá antes de las 16 hs y llega en el día
            </li>
            <li>
              <Link
                href="/puntos-de-retiro"
                className="underline underline-offset-2"
              >
                Puntos de retiro
              </Link>
            </li>
            <li>25% OFF abonando por transferencia bancaria</li>
            <li>Hasta 3 cuotas sin interés</li>
          </ul>

          {activeProduct.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {activeProduct.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{priced.price}</p>
            <p className="truncate text-[11px] text-[#16a34a]">
              {priced.transfer} transf.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!size}
            className={`btn-press add-cart-btn flex shrink-0 items-center justify-center gap-1.5 px-4 py-3 text-[11px] font-semibold tracking-[0.12em] text-white uppercase ${
              added
                ? "add-cart-btn-success"
                : "bg-[#222222] disabled:cursor-not-allowed disabled:bg-black/30"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {addLabelMobile}
            </span>
          </button>
        </div>
      </div>

      <CartToast toast={toast} onClose={closeToast} />

      {relatedItems.length > 0 && (
        <section className="mt-14 border-t border-black/5 pt-10">
          <h2 className="font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
            Más de {activeProduct.brand}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {relatedItems.map((item, index) => (
              <ProductCard
                key={`rel-${item.slug}-${item.variantId}`}
                product={item}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      {recentItems.length > 0 && (
        <section className="mt-14 border-t border-black/5 pt-10">
          <h2 className="font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
            Vistos recientemente
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {recentItems.map((item, index) => (
              <ProductCard
                key={`${item.slug}-${item.variantId}`}
                product={item}
                index={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
