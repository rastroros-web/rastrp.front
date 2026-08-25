"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { ShopChrome } from "@/components/ShopChrome";
import { useStore } from "@/components/store/StoreProvider";

const fieldClass =
  "w-full border border-black/10 px-3 py-2.5 outline-none focus:border-[#222222]";

function LoginForm() {
  const { login, register, session, ready } = useStore();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/cuenta";
  const [mode, setMode] = useState<"login" | "register">(
    search.get("mode") === "register" ? "register" : "login"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(search.get("email") || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handledAuth = useRef(false);

  useEffect(() => {
    if (!ready || !session || handledAuth.current) return;
    const dest =
      (session.role === "admin" || session.role === "staff") &&
      (next.startsWith("/admin") || next === "/cuenta")
        ? next.startsWith("/admin")
          ? next
          : "/admin"
        : next;
    router.replace(dest);
  }, [ready, session, next, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result =
      mode === "login"
        ? await login(email, password)
        : await register({ name, email, password, phone });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handledAuth.current = true;
    if (mode === "register") {
      const cupon = result.welcomeCoupon
        ? `&cupon=${encodeURIComponent(result.welcomeCoupon)}`
        : "";
      router.push(`/cuenta?bienvenida=1${cupon}`);
      return;
    }
    const dest =
      result.ok &&
      (result.role === "admin" || result.role === "staff") &&
      next === "/cuenta"
        ? "/admin"
        : next;
    router.push(dest);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
        {mode === "login" ? "Ingresar" : "Crear cuenta"}
      </h1>
      <p className="mt-2 text-sm text-soft">
        {mode === "register"
          ? "Creá tu cuenta y te damos un cupón personal de 10% OFF para tu primera compra."
          : "Ingresá con tu cuenta de Rastro."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                Nombre
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
                Teléfono / WhatsApp
              </span>
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="341 351 5773"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
              />
            </label>
          </>
        )}
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
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
            Contraseña
          </span>
          <input
            required
            type={showPassword ? "text" : "password"}
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#222222] uppercase underline"
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="size-3.5" strokeWidth={2} />
            ) : (
              <Eye className="size-3.5" strokeWidth={2} />
            )}
            {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </button>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full bg-[#222222] px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60"
        >
          {loading
            ? "Ingresando…"
            : mode === "login"
              ? "Entrar"
              : "Registrarme"}
        </button>
      </form>

      {mode === "login" && (
        <p className="mt-4">
          <Link
            href="/cuenta/recuperar"
            className="text-[11px] font-semibold uppercase underline"
          >
            Olvidé mi contraseña
          </Link>
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError("");
        }}
        className="mt-4 text-[11px] font-semibold uppercase underline"
      >
        {mode === "login" ? "Crear cuenta nueva" : "Ya tengo cuenta"}
      </button>

      <p className="mt-6 text-center text-xs text-soft">
        <Link href="/productos" className="underline">
          Volver a la tienda
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ShopChrome>
      <main className="flex flex-1 items-center justify-center px-4 py-12 md:py-16">
        <Suspense fallback={<p className="text-sm text-soft">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </ShopChrome>
  );
}
