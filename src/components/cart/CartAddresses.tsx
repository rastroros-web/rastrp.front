"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "@/components/store/StoreProvider";
import type { SavedAddress } from "@/lib/mock/types";
import { FancySelect } from "@/components/ui/FancySelect";
import { argentinaProvinceOptions } from "@/lib/argentinaProvinces";
import { useAlert } from "@/components/ui/AlertProvider";

const GUEST_KEY = "rastro_guest_addresses";

const emptyForm = {
  label: "",
  street: "",
  number: "",
  floor: "",
  city: "",
  province: "Santa Fe",
  postalCode: "",
};

function readGuest(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type CartAddressesProps = {
  onSelect?: (address: SavedAddress) => void;
  selectedId?: string | null;
};

export function CartAddresses({ onSelect, selectedId }: CartAddressesProps) {
  const { session, saveAddress, deleteAddress } = useStore();
  const { confirm } = useAlert();
  const [list, setList] = useState<SavedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.addresses?.length) {
      setList(session.addresses);
      return;
    }
    setList(session ? session.addresses || [] : readGuest());
  }, [session]);

  const fieldClass =
    "w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#222222]";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const street = form.street.trim();
    const number = form.number.trim();
    const city = form.city.trim();
    if (!street || !number || !city) {
      setError("Completá calle, número y ciudad.");
      return;
    }
    const address: SavedAddress = {
      id: `${street}-${number}-${city}-${form.postalCode}`
        .toLowerCase()
        .replace(/\s+/g, "-"),
      label: form.label.trim() || `${street} ${number}, ${city}`,
      street,
      number,
      floor: form.floor.trim() || undefined,
      city,
      province: form.province.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      fullName: session?.name,
      phone: session?.phone,
    };
    setSaving(true);
    const result = await saveAddress(address);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setList(result.addresses);
    setForm(emptyForm);
    setOpen(false);
    onSelect?.(address);
  };

  return (
    <div className="mt-4 border-t border-black/5 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] uppercase">
          Mis direcciones
        </h3>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setError("");
          }}
          className="btn-press border border-black/15 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase"
        >
          {open ? "Cancelar" : "Agregar dirección"}
        </button>
      </div>

      {!session && (
        <p className="mt-2 text-xs text-soft">
          Iniciá sesión para guardarlas en tu perfil. Sin cuenta quedan en este
          navegador.
        </p>
      )}

      {list.length > 0 && (
        <ul className="mt-3 space-y-2">
          {list.map((address) => (
            <li
              key={address.id}
              className={`flex items-start justify-between gap-3 border px-3 py-2.5 text-sm ${
                selectedId === address.id
                  ? "border-[#222222] bg-[#222222] text-white"
                  : "border-black/10 bg-white"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect?.(address)}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide">
                  {address.label || `${address.street} ${address.number}`}
                </span>
                <span
                  className={`mt-0.5 block text-[11px] ${
                    selectedId === address.id ? "text-white/70" : "text-soft"
                  }`}
                >
                  {address.city}
                  {address.postalCode ? ` · CP ${address.postalCode}` : ""}
                  {address.province ? ` · ${address.province}` : ""}
                </span>
              </button>
              <button
                type="button"
                className={`shrink-0 text-[10px] font-semibold uppercase underline underline-offset-2 ${
                  selectedId === address.id ? "text-white/80" : "text-red-600"
                }`}
                onClick={async () => {
                  const ok = await confirm({
                    eyebrow: "Direcciones",
                    title: "¿Borrar esta dirección?",
                    message: address.label || `${address.street} ${address.number}`,
                    confirmLabel: "Borrar",
                    cancelLabel: "Conservar",
                    tone: "danger",
                  });
                  if (!ok) return;
                  const result = await deleteAddress(address.id);
                  if (result.ok) setList(result.addresses);
                  else setError(result.error);
                }}
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}

      {list.length === 0 && !open && (
        <p className="mt-3 text-xs text-soft">
          Todavía no hay direcciones guardadas.
        </p>
      )}

      {open && (
        <form onSubmit={onSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
              Etiqueta
            </span>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className={fieldClass}
              placeholder="Casa, Laburo…"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
              Calle *
            </span>
            <input
              required
              value={form.street}
              onChange={(e) =>
                setForm((f) => ({ ...f, street: e.target.value }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
              Número *
            </span>
            <input
              required
              value={form.number}
              onChange={(e) =>
                setForm((f) => ({ ...f, number: e.target.value }))
              }
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
              Piso / depto
            </span>
            <input
              value={form.floor}
              onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
              CP
            </span>
            <input
              value={form.postalCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, postalCode: e.target.value }))
              }
              className={fieldClass}
              placeholder="2000"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[10px] font-semibold tracking-[0.12em] uppercase">
              Ciudad *
            </span>
            <input
              required
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <FancySelect
            label="Provincia"
            value={form.province}
            options={argentinaProvinceOptions}
            onChange={(value) =>
              setForm((f) => ({ ...f, province: value }))
            }
          />
          {error && (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60 sm:col-span-2"
          >
            {saving ? "Guardando…" : "Guardar dirección"}
          </button>
        </form>
      )}
    </div>
  );
}
