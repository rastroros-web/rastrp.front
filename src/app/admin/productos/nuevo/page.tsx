"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Catálogo
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-wide uppercase">
          Nuevo producto
        </h1>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
