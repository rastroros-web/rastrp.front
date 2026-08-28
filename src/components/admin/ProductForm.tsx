"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import type { ColorVariant } from "@/data/catalog";
import { fillEmptyVariantImages, stripSizeChartImages } from "@/data/catalog";
import type { ShopProduct } from "@/lib/mock/types";
import { useStore } from "@/components/store/StoreProvider";
import {
  installmentFromPrice,
  installmentLabelFromPrice,
  parseMoney,
  slugify,
  transferFromPrice,
  uid,
} from "@/lib/mock/money";
import {
  createShopProduct,
  getBackendUrl,
  resolveMediaUrl,
  updateShopProduct,
  uploadShopImages,
  upsertShopVariant,
} from "@/lib/api/backend";
import { FancySelect } from "@/components/ui/FancySelect";

const BASE_BRANDS = [
  "Nike",
  "Adidas",
  "Vans",
  "New Balance",
  "Converse",
  "Puma",
  "Rastro",
  "Teva",
];

const SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43"];
const GENEROS = ["UNISEX", "HOMBRE", "MUJER", "NINOS"] as const;

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function emptyVariant(): ColorVariant {
  const price = "$50.000,00";
  return {
    id: uid("var"),
    name: "Blanca",
    color: "#f5f4f0",
    image: "",
    images: [""],
    price,
    transfer: transferFromPrice(price),
    installments: installmentFromPrice(price),
    installmentsLabel: installmentLabelFromPrice(price),
    sizes: SIZES.map((label) => ({
      label,
      inStock: label === "38" || label === "39",
      stock: label === "38" || label === "39" ? 2 : 0,
    })),
  };
}

const emptyProduct = (): ShopProduct => ({
  slug: "",
  name: "",
  brand: "Nike",
  category: "zapatillas",
  storeCategories: ["nike"],
  primaryCategory: "nike",
  description: "",
  tags: [],
  megaSale: false,
  megaSalePercent: null,
  megaSaleStartsAt: null,
  megaSaleEndsAt: null,
  active: true,
  variants: [emptyVariant()],
});

function toStoredImages(images: string[], fallbackImage?: string): string[] {
  const base = getBackendUrl();
  const raw = (
    images?.length ? images : fallbackImage ? [fallbackImage] : []
  )
    .map((src) => src.trim())
    .filter(Boolean)
    .filter((src) => src !== "/assets/products/product-1.webp");
  return stripSizeChartImages(raw).map((src) =>
    base && src.startsWith(base) ? src.slice(base.length) : src
  );
}

function variantStockMap(
  variant: ColorVariant,
  { includeZeros }: { includeZeros: boolean }
): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const s of variant.sizes) {
    const qty = s.stock ?? (s.inStock ? 1 : 0);
    if (includeZeros || qty > 0) stock[s.label] = qty;
  }
  return stock;
}

function variantApiPayload(
  variant: ColorVariant,
  opts: { includeZeros: boolean; slug?: boolean }
) {
  return {
    ...(opts.slug ? { slug: variant.id } : {}),
    color: variant.name.trim(),
    colorHex: variant.color,
    priceWeb: parseMoney(variant.price),
    priceTransfer: parseMoney(variant.transfer),
    images: toStoredImages(variant.images || [], variant.image),
    stock: variantStockMap(variant, { includeZeros: opts.includeZeros }),
  };
}

export function ProductForm({
  initial,
  mode,
  initialVariantId,
}: {
  initial?: ShopProduct;
  mode: "create" | "edit";
  initialVariantId?: string;
}) {
  const { saveProduct, products, reloadProducts } = useStore();
  const router = useRouter();
  const [product, setProduct] = useState<ShopProduct>(
    initial
      ? fillEmptyVariantImages(structuredClone(initial))
      : emptyProduct()
  );
  const [genero, setGenero] = useState<(typeof GENEROS)[number]>("UNISEX");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [extraBrands, setExtraBrands] = useState<string[]>([]);
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [variantIndex, setVariantIndex] = useState(() => {
    if (!initialVariantId || !initial?.variants?.length) return 0;
    const idx = initial.variants.findIndex((v) => v.id === initialVariantId);
    return idx >= 0 ? idx : 0;
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const brandOptions = useMemo(() => {
    const fromProducts = products.map((p) => p.brand).filter(Boolean);
    const current = product.brand ? [product.brand] : [];
    return [
      ...new Set([...BASE_BRANDS, ...fromProducts, ...extraBrands, ...current]),
    ].sort((a, b) => a.localeCompare(b, "es"));
  }, [products, extraBrands, product.brand]);

  const safeIndex = Math.min(
    variantIndex,
    Math.max(0, product.variants.length - 1)
  );
  const v = product.variants[safeIndex];

  const addBrand = () => {
    const name = newBrand.trim().replace(/\s+/g, " ");
    if (!name) return;
    const exists = brandOptions.some(
      (b) => b.toLowerCase() === name.toLowerCase()
    );
    const resolved =
      brandOptions.find((b) => b.toLowerCase() === name.toLowerCase()) ?? name;
    if (!exists) setExtraBrands((prev) => [...prev, name]);
    setProduct((p) => ({ ...p, brand: resolved }));
    setNewBrand("");
    setAddingBrand(false);
  };

  const setVariantField = (field: string, value: string) => {
    setProduct((prev) => {
      const variants = [...prev.variants];
      const i = Math.min(variantIndex, variants.length - 1);
      const current = { ...variants[i], [field]: value };
      if (field === "price") {
        current.transfer = transferFromPrice(value);
        current.installments = installmentFromPrice(value);
        current.installmentsLabel = installmentLabelFromPrice(value);
      }
      variants[i] = current;
      return { ...prev, variants };
    });
  };

  const galleryImages = () => {
    const list = (v.images?.length ? v.images : v.image ? [v.image] : []).slice();
    return stripSizeChartImages(list.map((src) => src.trim()).filter(Boolean));
  };

  const setVariantImages = (images: string[]) => {
    const nextImages = images.map((src) => src.trim()).filter(Boolean);
    setProduct((prev) => {
      const variants = [...prev.variants];
      const i = Math.min(variantIndex, variants.length - 1);
      variants[i] = {
        ...variants[i],
        images: nextImages,
        image: nextImages[0] || "",
      };
      return { ...prev, variants };
    });
  };

  const addImageUrls = (urls: string[]) => {
    const current = galleryImages();
    const next = [...current];
    for (const url of urls) {
      const clean = url.trim();
      if (clean && !next.includes(clean)) next.push(clean);
    }
    setVariantImages(next);
  };

  const removeImageSlot = (index: number) => {
    setVariantImages(galleryImages().filter((_, i) => i !== index));
  };

  const makePrincipal = (index: number) => {
    const next = [...galleryImages()];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.unshift(item);
    setVariantImages(next);
  };

  const moveImage = (from: number, to: number) => {
    if (from === to) return;
    const next = [...galleryImages()];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setVariantImages(next);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;
    setUploadError("");
    if (!getBackendUrl()) {
      setUploadError("No hay backend para subir archivos. Pegá una URL.");
      setUrlOpen(true);
      return;
    }
    setUploading(true);
    try {
      addImageUrls(await uploadShopImages(list));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "No se pudieron subir las imágenes."
      );
    } finally {
      setUploading(false);
    }
  };

  const addUrlFromDraft = () => {
    const url = urlDraft.trim();
    if (!url) return;
    addImageUrls([url]);
    setUrlDraft("");
    setUrlOpen(false);
  };

  const toggleSize = (label: string) => {
    setProduct((prev) => {
      const variants = [...prev.variants];
      const i = Math.min(variantIndex, variants.length - 1);
      const current = { ...variants[i] };
      const sizes = [...current.sizes];
      const idx = sizes.findIndex((s) => s.label === label);
      if (idx >= 0) {
        const was = (sizes[idx].stock ?? (sizes[idx].inStock ? 8 : 0)) > 0;
        const stock = was ? 0 : 8;
        sizes[idx] = { ...sizes[idx], stock, inStock: stock > 0 };
      } else {
        sizes.push({ label, inStock: true, stock: 8 });
        sizes.sort(
          (a, b) =>
            Number(a.label) - Number(b.label) || a.label.localeCompare(b.label)
        );
      }
      current.sizes = sizes;
      variants[i] = current;
      return { ...prev, variants };
    });
  };

  const setSizeStock = (label: string, stock: number) => {
    const qty = Math.max(0, Math.floor(stock));
    setProduct((prev) => {
      const variants = [...prev.variants];
      const i = Math.min(variantIndex, variants.length - 1);
      const current = { ...variants[i] };
      const sizes = [...current.sizes];
      const idx = sizes.findIndex((s) => s.label === label);
      if (idx >= 0) {
        sizes[idx] = { ...sizes[idx], stock: qty, inStock: qty > 0 };
      } else {
        sizes.push({ label, stock: qty, inStock: qty > 0 });
      }
      current.sizes = sizes;
      variants[i] = current;
      return { ...prev, variants };
    });
  };

  const setAllSizes = (inStock: boolean) => {
    setProduct((prev) => {
      const variants = [...prev.variants];
      const i = Math.min(variantIndex, variants.length - 1);
      const current = { ...variants[i] };
      const existing = new Map(current.sizes.map((s) => [s.label, s]));
      const stock = inStock ? 8 : 0;
      current.sizes = SIZES.map((label) => ({
        label,
        stock,
        inStock: stock > 0,
      }));
      for (const s of existing.values()) {
        if (!SIZES.includes(s.label)) {
          current.sizes.push({ ...s, stock, inStock: stock > 0 });
        }
      }
      variants[i] = current;
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, emptyVariant()],
    }));
    setVariantIndex(product.variants.length);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const modelo = product.name.trim();
    if (mode === "create") {
      if (!modelo) {
        setError("El modelo es obligatorio");
        return;
      }
      const missingColor = product.variants.find((variant) => !variant.name.trim());
      if (missingColor) {
        setError("Cada variante necesita un color");
        return;
      }
      const hasStock = product.variants.some((variant) =>
        variant.sizes.some((s) => (s.stock ?? (s.inStock ? 1 : 0)) > 0)
      );
      if (!hasStock) {
        setError("Activá al menos un talle con stock");
        return;
      }
      if (product.megaSale) {
        const percent = Math.floor(Number(product.megaSalePercent));
        if (!Number.isFinite(percent) || percent < 1 || percent > 90) {
          setError("Mega Sale necesita un porcentaje entre 1 y 90.");
          return;
        }
        if (
          product.megaSaleStartsAt &&
          product.megaSaleEndsAt &&
          new Date(product.megaSaleEndsAt) <= new Date(product.megaSaleStartsAt)
        ) {
          setError("La fecha de fin tiene que ser posterior al inicio.");
          return;
        }
      }

      if (getBackendUrl()) {
        try {
          setSaving(true);
          const brand = product.brand;
          const primary = slugify(brand);
          await createShopProduct({
            brand,
            modelo,
            genero,
            tipo: product.category === "sandalias" ? "OTRO" : "ZAPATILLA",
            description: product.description || undefined,
            megaSale: Boolean(product.megaSale),
            megaSalePercent: product.megaSale
              ? Number(product.megaSalePercent)
              : null,
            megaSaleStartsAt: product.megaSale
              ? product.megaSaleStartsAt || new Date().toISOString()
              : null,
            megaSaleEndsAt: product.megaSale
              ? product.megaSaleEndsAt || null
              : null,
            storeCategories: Array.from(
              new Set([primary, ...(product.storeCategories || [])])
            ),
            tags: product.tags,
            variants: product.variants.map((variant) =>
              variantApiPayload(variant, { includeZeros: false })
            ),
          });
          saveProduct({
            ...product,
            name: modelo,
            slug: slugify(`${brand}-${modelo}`),
            variants: product.variants.map((variant) => {
              const images = (variant.images || [])
                .map((src) => src.trim())
                .filter(Boolean);
              return {
                ...variant,
                images,
                image: images[0] || variant.image || "",
              };
            }),
          });
          await reloadProducts();
          router.push("/admin/productos");
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo crear");
        } finally {
          setSaving(false);
        }
        return;
      }
    }

    if (mode === "edit" && getBackendUrl() && product.id) {
      if (product.megaSale) {
        const percent = Math.floor(Number(product.megaSalePercent));
        if (!Number.isFinite(percent) || percent < 1 || percent > 90) {
          setError("Mega Sale necesita un porcentaje entre 1 y 90.");
          return;
        }
        if (
          product.megaSaleStartsAt &&
          product.megaSaleEndsAt &&
          new Date(product.megaSaleEndsAt) <= new Date(product.megaSaleStartsAt)
        ) {
          setError("La fecha de fin tiene que ser posterior al inicio.");
          return;
        }
      }
      try {
        setSaving(true);
        const brand = product.brand;
        const primary = slugify(brand);
        await updateShopProduct(product.id, {
          brand,
          ...(product.modelo ? { modelo: product.modelo } : {}),
          tipo: product.category === "sandalias" ? "OTRO" : "ZAPATILLA",
          description: product.description || undefined,
          megaSale: Boolean(product.megaSale),
          megaSalePercent: product.megaSale
            ? Number(product.megaSalePercent)
            : null,
          megaSaleStartsAt: product.megaSale
            ? product.megaSaleStartsAt || new Date().toISOString()
            : null,
          megaSaleEndsAt: product.megaSale
            ? product.megaSaleEndsAt || null
            : null,
          storeCategories: Array.from(
            new Set([primary, ...(product.storeCategories || [])])
          ),
        });
        for (const variant of product.variants) {
          if (!variant.name.trim()) {
            throw new Error("Cada variante necesita un color");
          }
          await upsertShopVariant(product.id, {
            ...variantApiPayload(variant, { includeZeros: true, slug: true }),
          });
        }
        await reloadProducts();
        saveProduct({
          ...product,
          variants: product.variants.map((variant) => {
            const images = (variant.images || [])
              .map((src) => src.trim())
              .filter(Boolean);
            return {
              ...variant,
              images,
              image: images[0] || variant.image || "",
            };
          }),
        });
        router.push("/admin/productos");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar");
      } finally {
        setSaving(false);
      }
      return;
    }

    const name = product.name.trim();
    if (!name) {
      setError("El nombre es obligatorio");
      return;
    }
    const hasStock = product.variants.some((variant) =>
      variant.sizes.some((s) => (s.stock ?? (s.inStock ? 1 : 0)) > 0)
    );
    if (!hasStock) {
      setError("Activá al menos un talle con stock");
      return;
    }
    let slug = product.slug.trim() || slugify(name);
    if (mode === "create" && products.some((p) => p.slug === slug)) {
      slug = `${slug}-${uid("x").slice(-4)}`;
    }
    const brand = product.brand;
    const primary = slugify(brand);
    const saved: ShopProduct = {
      ...product,
      name,
      slug,
      primaryCategory: primary,
      storeCategories: Array.from(
        new Set([primary, ...(product.storeCategories || [])])
      ),
      variants: product.variants.map((variant) => ({
        ...variant,
        id: variant.id || slugify(variant.name) || uid("var"),
        images:
          variant.images?.length > 0
            ? variant.images
            : [variant.image || "/assets/products/product-1.webp"],
        image: variant.image || variant.images?.[0] || "",
      })),
    };
    saved.variants = saved.variants.map((variant) => ({
      ...variant,
      image:
        variant.images.find((src) => src.trim()) ||
        variant.image ||
        "",
      images: variant.images.filter((src) => src.trim()),
    }));
    saveProduct(saved);
    router.push("/admin/productos");
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            {mode === "create" ? "Modelo" : "Nombre"}
          </span>
          <input
            value={product.name}
            onChange={(e) =>
              setProduct((p) => ({
                ...p,
                name: e.target.value,
                slug: mode === "create" ? slugify(`${p.brand}-${e.target.value}`) : p.slug,
              }))
            }
            placeholder={mode === "create" ? "Samba" : ""}
            className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
            required
          />
          {mode === "create" ? (
            <p className="mt-1 text-xs text-soft">
              Se guarda como{" "}
              <span className="font-semibold text-[#222222]">
                {product.brand} {product.name.trim() || "Modelo"}
              </span>
              {v?.name?.trim()
                ? ` · variante ${product.brand} ${product.name.trim() || "Modelo"} ${v.name.trim()}`
                : null}
            </p>
          ) : null}
        </label>

        {mode === "edit" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            Slug
          </span>
          <input
            value={product.slug}
            onChange={(e) => setProduct((p) => ({ ...p, slug: e.target.value }))}
            className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
            disabled={mode === "edit"}
          />
        </label>
        ) : (
        <FancySelect
          label="Género"
          value={genero}
          options={GENEROS.map((g) => ({
            value: g,
            label: g === "NINOS" ? "NIÑOS" : g,
          }))}
          onChange={(value) =>
            setGenero(value as (typeof GENEROS)[number])
          }
        />
        )}

        <div className="block text-sm">
          <FancySelect
            label="Marca"
            value={product.brand}
            options={brandOptions.map((b) => ({ value: b, label: b }))}
            onChange={(value) => {
              setAddingBrand(false);
              setProduct((p) => ({ ...p, brand: value }));
            }}
          />
          {!addingBrand ? (
            <button
              type="button"
              onClick={() => setAddingBrand(true)}
              className="mt-2 text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
            >
              ＋ Agregar marca
            </button>
          ) : (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                autoFocus
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBrand();
                  }
                }}
                placeholder="Ej: Asics, Jordan…"
                className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={addBrand}
                  className="btn-press bg-[#222222] px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingBrand(false);
                    setNewBrand("");
                  }}
                  className="btn-press border border-black/15 px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <FancySelect
          label="Categoría"
          value={product.category}
          options={[
            { value: "zapatillas", label: "Zapatillas" },
            { value: "sandalias", label: "Sandalias" },
            { value: "sale", label: "Sale" },
          ]}
          onChange={(value) =>
            setProduct((p) => ({
              ...p,
              category: value as ShopProduct["category"],
            }))
          }
        />

        <div className="space-y-3 md:col-span-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={Boolean(product.megaSale)}
              onChange={(e) =>
                setProduct((p) => ({
                  ...p,
                  megaSale: e.target.checked,
                  megaSaleStartsAt:
                    e.target.checked && !p.megaSaleStartsAt
                      ? new Date().toISOString()
                      : p.megaSaleStartsAt,
                }))
              }
              className="size-4 accent-[#222222]"
            />
            <span>
              <span className="block text-[11px] font-semibold tracking-[0.14em] uppercase">
                Mega Sale
              </span>
              <span className="text-xs text-soft">
                Oferta con porcentaje y vigencia. Aparece en Mega Sale mientras esté activa.
              </span>
            </span>
          </label>
          {product.megaSale ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
                  % de oferta
                </span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={product.megaSalePercent ?? ""}
                  onChange={(e) =>
                    setProduct((p) => ({
                      ...p,
                      megaSalePercent: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="20"
                  className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Desde
                </span>
                <input
                  type="datetime-local"
                  value={toLocalInput(product.megaSaleStartsAt)}
                  onChange={(e) =>
                    setProduct((p) => ({
                      ...p,
                      megaSaleStartsAt: fromLocalInput(e.target.value),
                    }))
                  }
                  className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Hasta
                </span>
                <input
                  type="datetime-local"
                  value={toLocalInput(product.megaSaleEndsAt)}
                  onChange={(e) =>
                    setProduct((p) => ({
                      ...p,
                      megaSaleEndsAt: fromLocalInput(e.target.value),
                    }))
                  }
                  className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
                />
              </label>
            </div>
          ) : null}
        </div>

        {(mode === "create" || product.variants.length > 1) && (
          <div className="md:col-span-2">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Color / variante a editar
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant, i) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantIndex(i)}
                  className={`chip-press border px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                    i === safeIndex
                      ? "border-[#222222] bg-[#222222] text-white"
                      : "border-black/15 bg-white hover:border-neutral-900"
                  }`}
                >
                  {variant.name || `Color ${i + 1}`}
                </button>
              ))}
              {mode === "create" ? (
                <button
                  type="button"
                  onClick={addVariant}
                  className="chip-press border border-dashed border-black/25 px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase text-soft hover:border-[#222222] hover:text-[#222222]"
                >
                  ＋ Agregar color
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-soft">
              Estás editando:{" "}
              <span className="font-semibold text-[#222222]">{v.name}</span> ·
              los cambios de stock/precio aplican a este color
            </p>
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            Color
          </span>
          <input
            value={v.name}
            onChange={(e) => setVariantField("name", e.target.value)}
            placeholder="Blanca"
            className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            Hex color
          </span>
          <input
            type="color"
            value={v.color}
            onChange={(e) => setVariantField("color", e.target.value)}
            className="h-11 w-full border border-black/10 bg-white px-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            Precio
          </span>
          <input
            value={v.price}
            onChange={(e) => setVariantField("price", e.target.value)}
            placeholder="$50.000,00"
            className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            Transferencia (auto)
          </span>
          <input
            value={v.transfer}
            readOnly
            className="w-full border border-black/10 bg-[#f5f4f0] px-3 py-2.5 text-soft"
          />
        </label>

        <div className="md:col-span-2 space-y-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
              Fotos de esta variante
            </p>
            <p className="mt-1 text-xs text-soft">
              La primera es la principal. Arrastrá para reordenar.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {galleryImages().map((src, index) => (
              <div
                key={`${src}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => setDragIndex(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex != null) moveImage(dragIndex, index);
                  setDragIndex(null);
                }}
                className={`group relative aspect-[3/4] cursor-grab overflow-hidden border bg-[#f5f4f0] active:cursor-grabbing ${
                  dragIndex === index
                    ? "border-[#222222] opacity-60"
                    : index === 0
                      ? "border-[#222222]"
                      : "border-black/10"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(src)}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                {index === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 bg-[#222222] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-white uppercase">
                    Principal
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrincipal(index)}
                    className="absolute bottom-1.5 left-1.5 hidden items-center gap-1 bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] uppercase group-hover:flex"
                    title="Usar como principal"
                  >
                    <Star className="size-2.5" />
                    Principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImageSlot(index)}
                  className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center bg-white/95 text-[#222222] opacity-0 transition group-hover:opacity-100"
                  aria-label="Quitar foto"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (e.dataTransfer.types.includes("Files")) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.length) {
                  void uploadFiles(e.dataTransfer.files);
                }
              }}
              className={`flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed px-2 text-center transition ${
                dragOver
                  ? "border-[#222222] bg-white"
                  : "border-black/20 bg-white hover:border-[#222222]"
              } disabled:opacity-60`}
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-soft" />
              ) : (
                <ImagePlus className="size-5 text-soft" />
              )}
              <span className="text-[10px] font-semibold tracking-[0.1em] text-soft uppercase">
                {uploading ? "Subiendo…" : "Subir fotos"}
              </span>
            </button>
          </div>

          {uploadError ? (
            <p className="text-xs text-red-600">{uploadError}</p>
          ) : null}

          {!urlOpen ? (
            <button
              type="button"
              onClick={() => setUrlOpen(true)}
              className="text-[11px] font-semibold tracking-[0.12em] text-soft uppercase underline underline-offset-2"
            >
              Pegar URL
            </button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                autoFocus
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrlFromDraft();
                  }
                }}
                placeholder="https://…"
                className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#222222]"
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={addUrlFromDraft}
                  className="btn-press bg-[#222222] px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] text-white uppercase"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlOpen(false);
                    setUrlDraft("");
                  }}
                  className="btn-press border border-black/15 px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
              Talles
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAllSizes(true)}
                className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase underline"
              >
                Todos con stock
              </button>
              <button
                type="button"
                onClick={() => setAllSizes(false)}
                className="text-[10px] font-semibold tracking-[0.12em] text-soft uppercase underline"
              >
                Todos sin stock
              </button>
            </div>
          </div>
          <p className="mb-3 text-xs text-soft">
            Tocá un talle para activar/desactivar. Ajustá la cantidad abajo.
          </p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {SIZES.map((label) => {
              const size = v.sizes.find((s) => s.label === label);
              const qty = size?.stock ?? (size?.inStock ? 8 : 0);
              const active = qty > 0;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleSize(label)}
                  className={`chip-press px-2 py-3 text-sm font-semibold ${
                    active
                      ? "bg-[#222222] text-white"
                      : "border border-black/15 bg-white text-soft line-through"
                  }`}
                >
                  {label}
                  {active ? (
                    <span className="mt-0.5 block text-[9px] font-medium opacity-80">
                      {qty}u
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {SIZES.map((label) => {
              const size = v.sizes.find((s) => s.label === label);
              const qty = size?.stock ?? (size?.inStock ? 8 : 0);
              return (
                <input
                  key={`qty-${label}`}
                  type="number"
                  min={0}
                  max={99}
                  value={qty}
                  onChange={(e) => setSizeStock(label, Number(e.target.value))}
                  className="border border-black/10 px-1 py-1.5 text-center text-xs outline-none"
                  aria-label={`Stock talle ${label}`}
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-soft">
            Con stock:{" "}
            {v.sizes
              .filter((s) => (s.stock ?? (s.inStock ? 1 : 0)) > 0)
              .map((s) => `${s.label}(${s.stock ?? 1})`)
              .join(", ") || "ninguno"}
          </p>
        </div>

        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] uppercase">
            Descripción
          </span>
          <textarea
            value={product.description}
            onChange={(e) =>
              setProduct((p) => ({ ...p, description: e.target.value }))
            }
            rows={5}
            className="w-full border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-[#222222]"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-press bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60"
        >
          {saving
            ? mode === "create"
              ? "Creando…"
              : "Guardando…"
            : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          className="btn-press border border-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
