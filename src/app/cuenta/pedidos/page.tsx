"use client";

import { ShopImage as Image } from "@/components/ShopImage";
import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";
import { AccountGate } from "@/components/account/AccountGate";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";

function OrdersContent() {
  const { session, orders } = useStore();
  const myOrders = orders.filter((o) => o.userId === session!.id);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 pb-28 md:px-6 md:py-12 md:pb-14 lg:py-14">
      <Link
        href="/cuenta"
        className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
      >
        ← Mi cuenta
      </Link>
      <header className="mt-4 border-b border-black/5 pb-6 md:mt-6 md:pb-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Cuenta
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
          Mis pedidos
        </h1>
        <p className="mt-2 text-sm text-soft">
          {myOrders.length} pedido{myOrders.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="mt-6 space-y-4 md:mt-8 md:space-y-5">
        {myOrders.map((o) => (
          <article
            key={o.id}
            className="border border-black/5 bg-white p-4 md:p-6"
          >
            {/* —— Mobile layout —— */}
            <div className="md:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold tracking-wide uppercase">
                    {o.id}
                  </p>
                  <p className="mt-1 text-xs text-soft">
                    {new Date(o.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <span className="shrink-0 bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                  {o.status}
                </span>
              </div>

              <p className="mt-3 text-base font-semibold">
                {formatMoney(o.total)}
              </p>

              <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {o.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex w-[72%] max-w-[260px] shrink-0 items-center gap-3 border border-black/5 bg-[#f5f4f0] p-2.5"
                  >
                    <div className="relative size-14 shrink-0 bg-white">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium uppercase">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-soft">
                        {item.variantName} · {item.size} · x{item.qty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={`/cuenta/pedidos/${o.id}`}
                className="btn-press mt-4 flex w-full items-center justify-center bg-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
              >
                {o.status === "pendiente" && o.paymentMethod === "transferencia"
                  ? "Ver datos para transferir"
                  : "Ver seguimiento"}
              </Link>
            </div>

            {/* —— Desktop layout —— */}
            <div className="hidden md:block">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/cuenta/pedidos/${o.id}`}
                      className="font-display text-2xl font-bold tracking-wide uppercase underline-offset-2 hover:underline"
                    >
                      {o.id}
                    </Link>
                    <span className="bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-soft">
                    {new Date(o.createdAt).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold">{formatMoney(o.total)}</p>
                  <Link
                    href={`/cuenta/pedidos/${o.id}`}
                    className="btn-press mt-3 inline-flex border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
                  >
                    {o.status === "pendiente" &&
                    o.paymentMethod === "transferencia"
                      ? "Ver datos para transferir"
                      : "Ver seguimiento"}
                  </Link>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {o.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex min-w-[220px] flex-1 basis-[220px] items-center gap-3 border border-black/5 bg-[#f5f4f0] p-3"
                  >
                    <div className="relative size-14 shrink-0 bg-white">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium uppercase">
                        {item.productName}
                      </p>
                      <p className="text-xs text-soft">
                        {item.variantName} · {item.size} · x{item.qty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
        {myOrders.length === 0 && (
          <p className="py-12 text-center text-sm text-soft">
            No hay pedidos.{" "}
            <Link href="/productos" className="underline">
              Ir al catálogo
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function AccountOrdersPage() {
  return (
    <ShopChrome>
      <AccountGate>
        <OrdersContent />
      </AccountGate>
    </ShopChrome>
  );
}
