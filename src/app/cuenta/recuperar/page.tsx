"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ShopChrome } from "@/components/ShopChrome";
import { getBackendUrl, requestPasswordReset } from "@/lib/api/backend";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!getBackendUrl()) {
        throw new Error("El servidor no está disponible ahora.");
      }
      const data = await requestPasswordReset(email);
      setSent(true);
      setDevUrl(data.devResetUrl || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el enlace."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopChrome>
      <main className="flex flex-1 items-center justify-center px-4 py-12 md:py-16">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm text-soft">
            Ingresá el email de tu cuenta y te mandamos un enlace para elegir
            una nueva.
          </p>

          {sent ? (
            <div className="mt-6 space-y-4 text-sm">
              <p>
                Si ese email está registrado, te enviamos el enlace. Revisá
                spam si no lo ves.
              </p>
              {devUrl ? (
                <p>
                  <span className="text-soft">En local: </span>
                  <Link href={devUrl} className="underline">
                    restablecer ahora
                  </Link>
                </p>
              ) : null}
              <Link
                href="/cuenta/login"
                className="inline-block text-[11px] font-semibold uppercase underline"
              >
                Volver a ingresar
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                  Email
                </span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/10 px-3 py-2.5 outline-none focus:border-[#222222]"
                />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-press w-full bg-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60"
              >
                {loading ? "Enviando…" : "Enviar enlace"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-soft">
            <Link href="/cuenta/login" className="underline">
              Volver a ingresar
            </Link>
          </p>
        </div>
      </main>
    </ShopChrome>
  );
}
