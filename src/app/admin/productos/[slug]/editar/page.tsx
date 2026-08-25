"use client";

import { use, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { useStore } from "@/components/store/StoreProvider";

function EditProductInner({ slug }: { slug: string }) {
  const search = useSearchParams();
  const variantId = search.get("variant") || undefined;
  const { getProduct, ready } = useStore();
  const product = getProduct(slug);

  if (!ready) {
    return <p className="text-sm text-soft">Cargando…</p>;
  }
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Catálogo
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-wide uppercase">
          Editar producto
        </h1>
        <p className="mt-1 text-sm text-soft">
          {product.name}
          {product.variants.length > 1
            ? ` · ${product.variants.length} colores`
            : ""}
        </p>
      </div>
      <ProductForm
        mode="edit"
        initial={product}
        initialVariantId={variantId}
      />
    </div>
  );
}

export default function AdminEditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<p className="text-sm text-soft">Cargando…</p>}>
      <EditProductInner slug={slug} />
    </Suspense>
  );
}
