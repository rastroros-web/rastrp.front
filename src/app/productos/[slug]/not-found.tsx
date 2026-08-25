import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";

export default function ProductNotFound() {
  return (
    <ShopChrome>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-wide uppercase">
          Producto no encontrado
        </h1>
        <p className="mt-3 max-w-md text-sm text-soft">
          Puede que el link esté vencido o el modelo ya no esté disponible.
        </p>
        <Link
          href="/productos"
          className="mt-8 bg-[#222222] px-6 py-3 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition hover:bg-black"
        >
          Volver al catálogo
        </Link>
      </main>
    </ShopChrome>
  );
}
