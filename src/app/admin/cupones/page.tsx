"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useStore } from "@/components/store/StoreProvider";
import { formatMoney } from "@/lib/mock/money";
import {
  promoRulesText,
  RETIRED_CAMPAIGN_CODES,
  type PromoCode,
} from "@/lib/mock/promos";
import { FancySelect } from "@/components/ui/FancySelect";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { useAlert } from "@/components/ui/AlertProvider";
import {
  argentinaDateTimeToIso,
  isoToArgentinaParts,
} from "@/lib/argentinaTime";

const emptyForm = {
  code: "",
  label: "",
  type: "percent" as PromoCode["type"],
  value: 10,
  minPurchase: "",
  maxUses: "",
  expiresDate: "",
  expiresTime: "",
  oncePerUser: false,
};

export default function AdminCuponesPage() {
  const { orders, ready, promos, savePromo, deletePromo, reloadPromos } =
    useStore();
  const { confirm } = useAlert();
  const valid = orders.filter((o) => o.status !== "cancelado");
  const [form, setForm] = useState(emptyForm);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [formFlash, setFormFlash] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        await reloadPromos();
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, reloadPromos]);

  const rows = useMemo(
    () =>
      promos
        .filter(
          (p) =>
            !RETIRED_CAMPAIGN_CODES.includes(
              p.code as (typeof RETIRED_CAMPAIGN_CODES)[number]
            )
        )
        .map((p) => {
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

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFormFlash(true);
    window.setTimeout(() => setFormFlash(false), 1200);
    window.setTimeout(() => labelRef.current?.focus(), 320);
  };

  const startCreate = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setError("");
    setOkMsg("");
    focusForm();
  };

  const startEdit = (promo: PromoCode) => {
    const parts = isoToArgentinaParts(promo.expiresAt);
    setEditingCode(promo.code);
    setForm({
      code: promo.code,
      label: promo.label,
      type: promo.type,
      value: promo.value || 10,
      minPurchase: promo.minPurchase ? String(promo.minPurchase) : "",
      maxUses: promo.maxUses ? String(promo.maxUses) : "",
      expiresDate: parts.date,
      expiresTime: parts.time || (parts.date ? "23:59" : ""),
      oncePerUser: !!promo.oncePerUser,
    });
    setError("");
    setOkMsg("");
    focusForm();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOkMsg("");
    const expiresAt = form.expiresDate
      ? argentinaDateTimeToIso(form.expiresDate, form.expiresTime)
      : undefined;
    if (form.expiresDate && !expiresAt) {
      setError("Fecha de vencimiento inválida.");
      return;
    }
    setSaving(true);
    try {
      const result = await savePromo({
        code: form.code,
        label: form.label,
        type: form.type,
        value: Number(form.value),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        oncePerUser: form.oncePerUser || undefined,
        expiresAt,
        active: true,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const code = form.code.trim().toUpperCase();
      setOkMsg(`Cupón ${code} guardado en el servidor`);
      setForm(emptyForm);
      setEditingCode(null);
      await reloadPromos();
      window.setTimeout(() => setOkMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            Operación
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
            Cupones
          </h1>
          <p className="mt-1 text-sm text-soft">
            Creá o borrá cupones. Se guardan en el servidor y el checkout los
            valida ahí.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="btn-press bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
        >
          Nuevo cupón
        </button>
      </div>

      <div className="space-y-3">
        {loadingList && rows.length === 0 && (
          <p className="border border-black/5 bg-white px-5 py-10 text-center text-sm text-soft">
            Cargando cupones del servidor…
          </p>
        )}
        {!loadingList &&
          rows.map(({ promo, uses, users, discount }) => (
            <article
              key={promo.code}
              className={`border bg-white p-5 ${
                editingCode === promo.code
                  ? "border-[#222222]"
                  : "border-black/5"
              }`}
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
                      onClick={() => startEdit(promo)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-press border border-red-600 px-3 py-1.5 text-[10px] font-semibold uppercase text-red-600"
                      onClick={async () => {
                        const ok = await confirm({
                          eyebrow: "Cupones",
                          title: `¿Borrar ${promo.code}?`,
                          message:
                            "Los pedidos ya hechos no cambian. Este cupón deja de valer en checkout.",
                          confirmLabel: "Borrar cupón",
                          cancelLabel: "Conservar",
                          tone: "danger",
                        });
                        if (!ok) return;
                        const result = await deletePromo(promo.code);
                        if (result && !result.ok) {
                          setError(result.error);
                          focusForm();
                          return;
                        }
                        if (editingCode === promo.code) {
                          setEditingCode(null);
                          setForm(emptyForm);
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
        {!loadingList && rows.length === 0 && (
          <p className="border border-black/5 bg-white px-5 py-10 text-center text-sm text-soft">
            No hay cupones de campaña en el servidor. Tocá “Nuevo cupón” para
            crear el primero.
          </p>
        )}
      </div>

      <form
        ref={formRef}
        id="cupon-form"
        onSubmit={onSubmit}
        className={`scroll-mt-24 border bg-white p-5 space-y-3 transition-shadow ${
          formFlash
            ? "border-[#222222] shadow-[0_0_0_3px_rgba(34,34,34,0.15)]"
            : "border-black/5"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              {editingCode ? `Editando ${editingCode}` : "Nuevo cupón"}
            </h2>
            <p className="mt-1 text-xs text-soft">
              {editingCode
                ? "Cambiá los campos y guardá. Se actualiza en el servidor."
                : "Si el código ya existe, se actualiza. Si no, se crea. Los cupones de campaña no se acumulan con el de bienvenida."}
            </p>
          </div>
          {editingCode ? (
            <button
              type="button"
              onClick={startCreate}
              className="text-[11px] font-semibold tracking-[0.12em] text-soft uppercase underline underline-offset-2"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Código *
            </span>
            <input
              required
              value={form.code}
              readOnly={!!editingCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              className="w-full border border-black/10 px-3 py-2.5 text-sm font-mono outline-none read-only:bg-[#f5f4f0]"
              placeholder="VERANO15"
            />
          </label>
          <FancySelect
            label="Tipo *"
            value={form.type}
            options={[
              { value: "percent", label: "Porcentaje %" },
              { value: "fixed", label: "Monto fijo $" },
            ]}
            onChange={(value) =>
              setForm((f) => ({
                ...f,
                type: value as PromoCode["type"],
              }))
            }
          />
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Descripción *
            </span>
            <input
              ref={labelRef}
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
          <DateTimePicker
            label="Vence (Argentina)"
            date={form.expiresDate}
            time={form.expiresTime}
            onChange={({ date, time }) =>
              setForm((f) => ({
                ...f,
                expiresDate: date,
                expiresTime: date && !time ? "23:59" : time,
              }))
            }
          />
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
          disabled={saving}
          className="btn-press bg-[#222222] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60"
        >
          {saving
            ? "Guardando…"
            : editingCode
              ? "Actualizar cupón"
              : "Guardar cupón"}
        </button>
      </form>

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
