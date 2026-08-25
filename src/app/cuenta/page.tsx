"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ShopChrome } from "@/components/ShopChrome";
import { AccountGate } from "@/components/account/AccountGate";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";

function WelcomeBanner({ firstName }: { firstName: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const show = search.get("bienvenida") === "1";
  const cupon = search.get("cupon");
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    router.replace("/cuenta", { scroll: false });
  };

  return (
    <div className="mb-6 border border-[#222222] bg-[#222222] px-4 py-5 text-white md:mb-8 md:px-6 md:py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white uppercase">
            Bienvenido a Rastro
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
            ¡Hola, {firstName}!
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/75 md:text-base">
            Somos de Rosario, Santa Fe. Hacemos envíos a todo el país y también
            tenés puntos de retiro en Rosario.
          </p>
          {cupon ? (
            <div className="mt-4 max-w-xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-white uppercase">
                Tu cupón de bienvenida
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-[0.08em] uppercase">
                {cupon}
              </p>
              <p className="mt-1 text-sm text-white/70">
                10% OFF en tu primera compra. Es tuyo, de un solo uso, y lo
                aplicás en el checkout. También te lo mandamos por mail.
              </p>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/productos"
              className="btn-press bg-white px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#222222] uppercase"
            >
              Ir al catálogo
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="btn-press border border-white/30 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
            >
              Empezar
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-white/60 transition hover:text-white"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function AccountContent() {
  const { session, orders, logout, updateProfile } = useStore();
  const myOrders = orders.filter((o) => o.userId === session!.id);
  const [name, setName] = useState(session!.name);
  const [phone, setPhone] = useState(session!.phone || "");
  const [address, setAddress] = useState(session!.address || "");
  const [city, setCity] = useState(session!.city || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstName = (session?.name || "").trim().split(" ")[0] || "ahí";

  useEffect(() => {
    if (!session) return;
    setName(session.name);
    setPhone(session.phone || "");
    setAddress(session.address || "");
    setCity(session.city || "");
  }, [session]);

  const fieldClass =
    "w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#222222] md:px-4 md:py-3";

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-12 lg:py-14">
      <Suspense fallback={null}>
        <WelcomeBanner firstName={firstName} />
      </Suspense>

      <header className="flex flex-col gap-4 border-b border-black/5 pb-6 md:flex-row md:items-end md:justify-between md:pb-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Mi cuenta
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl md:text-5xl">
            Hola, {firstName}
          </h1>
          <p className="mt-2 text-sm text-soft">{session!.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(session!.role === "admin" || session!.role === "staff") && (
            <Link
              href="/admin"
              className="btn-press bg-brand px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Ir al admin
            </Link>
          )}
          <Link
            href="/cuenta/pedidos"
            className="btn-press border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            Mis pedidos
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="btn-press border border-black/15 px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 md:mt-8 md:gap-4">
        <div className="border border-black/5 bg-white px-4 py-4 md:px-5 md:py-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Pedidos
          </p>
          <p className="mt-1 font-display text-2xl font-bold md:text-3xl">
            {myOrders.length}
          </p>
        </div>
        <div className="border border-black/5 bg-white px-4 py-4 md:px-5 md:py-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Último estado
          </p>
          <p className="mt-1 text-sm font-semibold capitalize md:text-base">
            {myOrders[0]?.status ?? "—"}
          </p>
        </div>
        <div className="border border-black/5 bg-white px-4 py-4 md:px-5 md:py-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-soft uppercase">
            Ciudad
          </p>
          <p className="mt-1 text-sm font-semibold md:text-base">
            {city.trim() || "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-5 md:gap-8">
        <section className="border border-black/5 bg-white p-4 md:col-span-3 md:p-8">
          <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase">
            Datos personales
          </h2>
          <form
            className="mt-4 space-y-4 md:mt-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setSaved(false);
              setSaving(true);
              const result = await updateProfile({ name, phone, address, city });
              setSaving(false);
              if (!result.ok) {
                setError(result.error || "No se pudo guardar.");
                return;
              }
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm md:col-span-2">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Nombre y apellido
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  placeholder="Ej: Martina López"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Email
                </span>
                <input
                  value={session!.email}
                  disabled
                  className={`${fieldClass} bg-[#f5f4f0] text-soft`}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Teléfono / WhatsApp
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={fieldClass}
                  placeholder="Ej: +54 341 555-0199"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Dirección
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={fieldClass}
                  placeholder="Ej: San Martín 1234"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Ciudad
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={fieldClass}
                  placeholder="Ej: Rosario"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="btn-press bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              {saved && (
                <p className="text-sm font-medium text-[#16a34a]">
                  Datos actualizados
                </p>
              )}
              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}
            </div>
          </form>
        </section>

        <section className="border border-black/5 bg-white p-4 md:col-span-2 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase">
              Últimos pedidos
            </h2>
            <Link
              href="/cuenta/pedidos"
              className="text-[11px] font-semibold tracking-[0.12em] uppercase underline underline-offset-2"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-4 space-y-3 md:mt-6">
            {myOrders.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                href={`/cuenta/pedidos/${o.id}`}
                className="group block border border-black/5 px-3 py-3 transition hover:border-neutral-900 md:px-4 md:py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold tracking-wide uppercase md:text-lg">
                      {o.id}
                    </p>
                    <p className="mt-1 text-[11px] text-soft md:text-xs">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <span className="bg-[#f5f4f0] px-2 py-1 text-[9px] font-semibold tracking-[0.12em] text-soft uppercase transition group-hover:text-[#222222]">
                    {o.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold md:text-base">
                    {formatMoney(o.total)}
                  </p>
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-soft transition group-hover:text-[#222222]">
                    Ver →
                  </span>
                </div>
              </Link>
            ))}
            {myOrders.length === 0 && (
              <p className="py-8 text-center text-sm text-soft">
                Todavía no tenés pedidos
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <ShopChrome>
      <AccountGate>
        <AccountContent />
      </AccountGate>
    </ShopChrome>
  );
}
