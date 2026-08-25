"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import {
  promoRulesText,
  type PromoCode,
} from "@/lib/mock/promos";

const emptyForm = {
  code: "",
  label: "",
  type: "percent" as PromoCode["type"],
  value: 10,
  minPurchase: "",
  maxUses: "",
  oncePerUser: false,
};

export default function AdminCuponesPage() {
  const { orders, promos, savePromo, deletePromo } = useStore();
  const valid = orders.filter((o) => o.status !== "cancelado");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const rows = useMemo(
    () =>
      promos.map((p) => {
        const uses = valid.filter((o) => o.promoCode === p.code).length;
        const users = new Set(
          valid.filter((o) => o.promoCode === p.code).map((o) => o.userId)
        ).size;
        const discount = valid
          .filter((o) => o.promoCode === p.code)
          .reduce((s, o) => s + (o.discount ?? 0), 0);
        return { promo: p, uses, users, discount };
      }),
    [valid, promos]
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOkMsg("");
    const result = await savePromo({
      code: form.code,
      label: form.label,
      type: form.type,
      value: Number(form.value),
      minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      oncePerUser: form.oncePerUser || undefined,
      active: true,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOkMsg(`Cupón ${form.code.trim().toUpperCase()} guardado`);
    setForm(emptyForm);
    window.setTimeout(() => setOkMsg(""), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          Operación
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          Cupones
        </h1>
        <p className="mt-1 text-sm text-soft">
          Creá o borrá cupones. El checkout los valida contra el servidor.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="border border-black/5 bg-white p-5 space-y-3"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Nuevo / editar cupón
        </h2>
        <p className="text-xs text-soft">
          Si el código ya existe, se actualiza. Si no, se crea.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Código *
            </span>
            <input
              required
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              className="w-full border border-black/10 px-3 py-2.5 text-sm font-mono outline-none"
              placeholder="VERANO15"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Tipo *
            </span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as PromoCode["type"],
                }))
              }
              className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none"
            >
              <option value="percent">Porcentaje %</option>
              <option value="fixed">Monto fijo $</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Descripción *
            </span>
            <input
              required
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none"
              placeholder="15% OFF verano"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Valor * {form.type === "percent" ? "(%)" : "(ARS)"}
            </span>
            <input
              required
              type="number"
              min={1}
              value={form.value}
              onChange={(e) =>
                setForm((f) => ({ ...f, value: Number(e.target.value) }))
              }
              className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Compra mínima (ARS)
            </span>
            <input
              type="number"
              min={0}
              value={form.minPurchase}
              onChange={(e) =>
                setForm((f) => ({ ...f, minPurchase: e.target.value }))
              }
              className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none"
              placeholder="Opcional"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Máx. usos globales
            </span>
            <input
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxUses: e.target.value }))
              }
              className="w-full border border-black/10 px-3 py-2.5 text-sm outline-none"
              placeholder="Opcional"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.oncePerUser}
              onChange={(e) =>
                setForm((f) => ({ ...f, oncePerUser: e.target.checked }))
              }
              className="size-4 accent-[#222222]"
            />
            1 solo uso por usuario
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {okMsg && <p className="text-sm text-[#16a34a]">{okMsg}</p>}
        <button
          type="submit"
          className="btn-press bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
        >
          Guardar cupón
        </button>
      </form>

      <div className="space-y-3">
        {rows.map(({ promo, uses, users, discount }) => (
          <article
            key={promo.code}
            className="border border-black/5 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-bold tracking-wide">
                  {promo.code}
                </p>
                <p className="mt-1 text-sm text-soft">{promo.label}</p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right text-sm">
                <div>
                  <p className="font-medium">{uses} usos</p>
                  <p className="text-xs text-soft">{users} usuarios</p>
                  <p className="text-xs text-[#16a34a]">
                    −{formatMoney(discount)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-press border border-black/15 px-3 py-1.5 text-[10px] font-semibold uppercase"
                    onClick={() =>
                      setForm({
                        code: promo.code,
                        label: promo.label,
                        type: promo.type,
                        value: promo.value || 10,
                        minPurchase: promo.minPurchase
                          ? String(promo.minPurchase)
                          : "",
                        maxUses: promo.maxUses ? String(promo.maxUses) : "",
                        oncePerUser: !!promo.oncePerUser,
                      })
                    }
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-press border border-red-600 px-3 py-1.5 text-[10px] font-semibold uppercase text-red-600"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `¿Borrar el cupón ${promo.code}? Los pedidos ya hechos no cambian.`
                        )
                      ) {
                        await deletePromo(promo.code);
                      }
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {promoRulesText(promo).map((r) => (
                <span
                  key={r}
                  className="bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase"
                >
                  {r}
                </span>
              ))}
              <span className="bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase">
                {promo.type === "percent"
                  ? `${promo.value}%`
                  : formatMoney(promo.value)}
              </span>
              {promo.maxUses != null && (
                <span className="bg-[#f5f4f0] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase">
                  {uses}/{promo.maxUses} cupo
                </span>
              )}
            </div>
          </article>
        ))}
        {rows.length === 0 && (
          <p className="border border-black/5 bg-white px-5 py-10 text-center text-sm text-soft">
            No hay cupones. Creá uno arriba o usá Reset demo.
          </p>
        )}
      </div>

      <p className="text-xs text-soft">
        Tip:{" "}
        <Link href="/checkout" className="underline">
          probá el cupón nuevo en checkout
        </Link>
        .
      </p>
    </div>
  );
}
