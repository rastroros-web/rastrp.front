"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShopChrome } from "@/components/ShopChrome";
import { resetShopPassword } from "@/lib/api/backend";

const fieldClass =
  "w-full border border-black/10 px-3 py-2.5 outline-none focus:border-[#222222]";

function NuevaClaveForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("El enlace no es válido. Pedí uno nuevo.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await resetShopPassword(token, password);
      router.replace("/cuenta/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
        Nueva contraseña
      </h1>
      <p className="mt-2 text-sm text-soft">
        Elegí una contraseña de al menos 6 caracteres.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
            Contraseña
          </span>
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
            Repetir contraseña
          </span>
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldClass}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          className="btn-press w-full bg-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-soft">
        <Link href="/cuenta/login" className="underline">
          Volver a ingresar
        </Link>
      </p>
    </div>
  );
}

export default function NuevaClavePage() {
  return (
    <ShopChrome>
      <main className="flex flex-1 items-center justify-center px-4 py-12 md:py-16">
        <Suspense fallback={<p className="text-sm text-soft">Cargando…</p>}>
          <NuevaClaveForm />
        </Suspense>
      </main>
    </ShopChrome>
  );
}
