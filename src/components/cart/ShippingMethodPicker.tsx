"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { formatMoney } from "@/lib/mock/money";
import {
  quoteCorreoShipping,
  type ShippingQuoteResult,
  type ShippingRate,
} from "@/lib/api/backend";

const CARRIERS = [
  { id: "correo_argentino", label: "Correo Argentino" },
  { id: "andreani", label: "Andreani" },
] as const;

function ratesFor(quote: ShippingQuoteResult, carrierId: string) {
  return quote.rates.filter(
    (r) => (r.carrier || "correo_argentino") === carrierId
  );
}

/** La tarifa viaja junto al id de su cotización: el backend cobra a partir de ese par. */
type QuotedRate = ShippingRate & { quoteId?: string | null };

function withQuote(
  rate: ShippingRate | null,
  quote: ShippingQuoteResult | null
): QuotedRate | null {
  if (!rate) return null;
  return { ...rate, quoteId: quote?.quoteId ?? null };
}

function ShippingLogoLoader({ packages }: { packages: number }) {
  return (
    <div className="shipping-logo-loader mt-4 overflow-hidden border border-black/10 bg-[#f5f4f0] px-3 py-5">
      <div className="relative h-12">
        <div className="shipping-logo absolute inset-y-0 flex items-center">
          <Image
            src="/assets/logo/rastro-logo.webp"
            alt=""
            width={88}
            height={32}
            className="h-8 w-auto object-contain brightness-0"
            style={{ width: "auto", height: "2rem" }}
            aria-hidden
          />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-soft">
        {packages === 1
          ? "Cotizando Correo y Andreani…"
          : `Cotizando envío de ${packages} pares…`}
      </p>
    </div>
  );
}

export function ShippingMethodPicker({
  postalCode,
  packages = 1,
  selectedRateId,
  onPostalCodeChange,
  onSelectRate,
  className = "",
  enabled = true,
}: {
  postalCode: string;
  packages?: number;
  selectedRateId?: string | null;
  onPostalCodeChange: (cp: string) => void;
  onSelectRate: (rate: QuotedRate | null) => void;
  className?: string;
  /** Evita cotizar cuando el picker está oculto (p. ej. otra zona en el carrito). */
  enabled?: boolean;
}) {
  const qty = Math.min(30, Math.max(1, Math.floor(Number(packages) || 1)));
  const [draft, setDraft] = useState(postalCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(null);
  const [quotedCp, setQuotedCp] = useState("");
  const requestId = useRef(0);
  const selectedRateIdRef = useRef(selectedRateId);
  const quotedKeyRef = useRef("");
  const inFlightKeyRef = useRef("");

  useEffect(() => {
    selectedRateIdRef.current = selectedRateId;
  }, [selectedRateId]);

  useEffect(() => {
    const cp = postalCode.replace(/\D/g, "").slice(0, 4);
    setDraft(cp);
    if (cp === "") {
      setQuote(null);
      setQuotedCp("");
      setError("");
      quotedKeyRef.current = "";
      inFlightKeyRef.current = "";
    }
  }, [postalCode]);

  useEffect(() => {
    if (!enabled) {
      quotedKeyRef.current = "";
      inFlightKeyRef.current = "";
    }
  }, [enabled]);

  const runQuote = useCallback(
    async (
      raw: string,
      options?: { preserveRate?: boolean; force?: boolean }
    ) => {
      const cp = raw.replace(/\D/g, "").slice(0, 4);
      const key = `${cp}:${qty}`;
      onPostalCodeChange(cp);
      if (cp.length !== 4) {
        setError("Ingresá un código postal de 4 dígitos.");
        setQuote(null);
        setQuotedCp("");
        quotedKeyRef.current = "";
        if (!options?.preserveRate) onSelectRate(null);
        return;
      }
      if (!options?.force && quotedKeyRef.current === key) return;

      const id = ++requestId.current;
      const rateIdToRestore = options?.preserveRate
        ? selectedRateIdRef.current
        : null;
      inFlightKeyRef.current = key;
      setLoading(true);
      setError("");
      if (!options?.preserveRate) onSelectRate(null);
      try {
        const data = await quoteCorreoShipping(cp, qty);
        if (id !== requestId.current) return;
        setQuote(data);
        setQuotedCp(cp);
        quotedKeyRef.current = key;
        if (rateIdToRestore) {
          const next =
            data.rates.find((r) => r.id === rateIdToRestore) || null;
          onSelectRate(withQuote(next, data));
        }
      } catch (err) {
        if (id !== requestId.current) return;
        setQuote(null);
        setQuotedCp("");
        quotedKeyRef.current = "";
        setError(
          err instanceof Error ? err.message : "No se pudo cotizar el envío."
        );
      } finally {
        if (inFlightKeyRef.current === key) inFlightKeyRef.current = "";
        if (id === requestId.current) setLoading(false);
      }
    },
    [onPostalCodeChange, onSelectRate, qty]
  );

  useEffect(() => {
    if (!enabled) return;
    const cp = postalCode.replace(/\D/g, "").slice(0, 4);
    if (cp.length !== 4) return;
    const key = `${cp}:${qty}`;
    if (quotedKeyRef.current === key || inFlightKeyRef.current === key) return;
    void runQuote(cp, { preserveRate: Boolean(selectedRateIdRef.current) });
  }, [postalCode, qty, enabled, runQuote]);

  return (
    <div className={className || undefined}>
      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
        Código postal *
      </span>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={4}
          value={draft}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 4);
            setDraft(next);
            if (next !== quotedCp) {
              setQuote(null);
              setError("");
              quotedKeyRef.current = "";
              onSelectRate(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runQuote(draft, { force: true });
            }
          }}
          placeholder="Ej. 5000"
          aria-label="Código postal"
          className="h-11 min-w-0 flex-1 border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#222222]"
        />
        <button
          type="button"
          onClick={() => void runQuote(draft, { force: true })}
          disabled={loading || draft.replace(/\D/g, "").length !== 4}
          aria-label="Calcular envío"
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center border border-[#222222] bg-[#222222] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Search className="size-4" strokeWidth={2.25} />
        </button>
      </div>

      {loading ? <ShippingLogoLoader packages={qty} /> : null}
      {error ? (
        <p className="mt-3 text-xs font-medium text-brand">{error}</p>
      ) : null}

      {!loading && quote?.rates?.length ? (
        <div className="mt-4 space-y-4">
          {CARRIERS.map((carrier) => {
            const list = ratesFor(quote, carrier.id);
            if (!list.length) return null;
            return (
              <div key={carrier.id}>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-soft uppercase">
                  {carrier.label}
                </p>
                <div className="mt-2 space-y-2">
                  {list.map((rate) => {
                    const active = selectedRateId === rate.id;
                    return (
                      <button
                        key={rate.id}
                        type="button"
                        onClick={() => onSelectRate(withQuote(rate, quote))}
                        className={`chip-press flex w-full items-baseline justify-between gap-3 border px-3 py-2.5 text-left ${
                          active
                            ? "border-[#222222] bg-[#222222] text-white"
                            : "border-black/10 bg-white hover:border-[#222222]"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium">
                            {rate.name}
                          </span>
                          <span
                            className={`mt-0.5 block text-[11px] ${
                              active ? "text-white/70" : "text-soft"
                            }`}
                          >
                            {rate.daysMin} a {rate.daysMax} días hábiles
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatMoney(rate.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-soft">
            El tiempo de entrega no considera feriados. Envío gratis desde
            $150.000.
          </p>
        </div>
      ) : null}

      {!loading && !error && !quote ? (
        <p className="mt-3 text-xs text-soft">
          Ingresá tu CP y tocá la lupa para cotizar Correo y Andreani.
        </p>
      ) : null}

      {!loading &&
      !error &&
      quotedCp.length === 4 &&
      quote &&
      !quote.rates?.length ? (
        <p className="mt-3 text-xs text-soft">
          No hay tarifas para ese código postal.
        </p>
      ) : null}
    </div>
  );
}
