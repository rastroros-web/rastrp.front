"use client";

import { FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import { Building2, X } from "lucide-react";
import {
  DEFAULT_TRANSFER_BANK,
  type TransferBankConfig,
} from "@/lib/mock/payment";
import {
  fetchAdminTransferBank,
  updateTransferBank,
} from "@/lib/api/backend";

const EMPTY: TransferBankConfig = {
  bankName: "",
  accountHolderName: "",
  cbu: "",
  alias: "",
  cuil: "",
};

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function validate(form: TransferBankConfig) {
  const errors: Partial<Record<keyof TransferBankConfig, string>> = {};
  if (!form.accountHolderName.trim()) {
    errors.accountHolderName = "Ingresá el titular.";
  }
  const cbu = digitsOnly(form.cbu);
  if (!cbu) errors.cbu = "Ingresá el CBU.";
  else if (cbu.length !== 22) errors.cbu = "El CBU tiene que tener 22 dígitos.";
  if (!form.alias.trim()) errors.alias = "Ingresá el alias.";
  const cuil = digitsOnly(form.cuil);
  if (!cuil) errors.cuil = "Ingresá el CUIT / CUIL.";
  else if (cuil.length !== 11) {
    errors.cuil = "El CUIT / CUIL tiene que tener 11 dígitos.";
  }
  return errors;
}

export function TransferBankSettings() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TransferBankConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [attempted, setAttempted] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    setLoading(true);
    try {
      const data = await fetchAdminTransferBank();
      setForm(data);
    } catch {
      setForm(DEFAULT_TRANSFER_BANK);
      setLoadError("No se pudieron cargar los datos. Mostramos los defaults.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const errors = useMemo(() => validate(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setSaveError("");
    setOkMsg("");
    if (!isValid) return;
    setSaving(true);
    try {
      const updated = await updateTransferBank({
        bankName: form.bankName.trim(),
        accountHolderName: form.accountHolderName.trim(),
        cbu: digitsOnly(form.cbu),
        alias: form.alias.trim(),
        cuil: form.cuil.trim(),
      });
      setForm(updated);
      setOkMsg("Guardado. Los clientes verán estos datos al transferir.");
      setAttempted(false);
      window.setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "No se pudo guardar"
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (key: keyof TransferBankConfig) =>
    attempted ? errors[key] : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setAttempted(false);
          setOkMsg("");
          setSaveError("");
        }}
        className="btn-press inline-flex items-center gap-2 border border-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
      >
        <Building2 className="size-3.5" />
        Datos bancarios
        {form.alias ? (
          <span className="max-w-[9rem] truncate font-medium normal-case tracking-normal text-soft">
            {form.alias}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            aria-labelledby={`${formId}-title`}
            className="w-full max-w-lg border border-black/10 bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-brand uppercase">
                  Transferencia
                </p>
                <h2
                  id={`${formId}-title`}
                  className="mt-1 text-sm font-semibold tracking-wide uppercase"
                >
                  Datos bancarios
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-soft hover:text-[#222222]"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="mb-4 text-sm text-soft">
                Cambiá alias, CBU o titular cuando rote el monotributo. Se
                muestran en checkout y en Mis pedidos.
              </p>

              {loading ? (
                <p className="text-sm text-soft">Cargando…</p>
              ) : (
                <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
                  {loadError ? (
                    <p className="text-sm text-amber-700 sm:col-span-2">
                      {loadError}
                    </p>
                  ) : null}
                  {(
                    [
                      ["bankName", "Banco", "Opcional", "Banco Galicia"],
                      [
                        "accountHolderName",
                        "Titular",
                        "Requerido",
                        "Rastro Calzados SAS",
                      ],
                      ["cbu", "CBU", "22 dígitos", "0070…"],
                      ["alias", "Alias", "Requerido", "RASTRO.ZAPAS"],
                      ["cuil", "CUIT / CUIL", "Requerido", "30-…"],
                    ] as const
                  ).map(([key, label, hint, placeholder]) => {
                    const id = `${formId}-${key}`;
                    const err = fieldError(key);
                    return (
                      <label key={key} className="space-y-1 sm:col-span-1">
                        <span className="flex items-baseline gap-2 text-[10px] font-semibold tracking-[0.12em] text-soft uppercase">
                          {label}
                          <span className="normal-case tracking-normal">
                            {hint}
                          </span>
                        </span>
                        <input
                          id={id}
                          value={form[key]}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={placeholder}
                          disabled={saving}
                          className={`w-full border px-3 py-2.5 text-sm outline-none focus:border-[#222222] ${
                            err ? "border-red-400" : "border-black/10"
                          } ${key === "cbu" ? "font-mono" : ""}`}
                        />
                        {err ? (
                          <span className="text-xs text-red-600">{err}</span>
                        ) : null}
                      </label>
                    );
                  })}

                  {saveError ? (
                    <p className="text-sm text-red-600 sm:col-span-2">
                      {saveError}
                    </p>
                  ) : null}
                  {okMsg ? (
                    <p className="text-sm text-emerald-700 sm:col-span-2">
                      {okMsg}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-40 sm:col-span-2"
                  >
                    {saving ? "Guardando…" : "Guardar datos bancarios"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
