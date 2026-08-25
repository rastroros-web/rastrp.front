"use client";

import { useEffect, useRef, useState } from "react";
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

export function ShippingMethodPicker({
  postalCode,
  packages = 1,
  selectedRateId,
  onPostalCodeChange,
  onSelectRate,
}: {
  postalCode: string;
  packages?: number;
  selectedRateId?: string | null;
  onPostalCodeChange: (cp: string) => void;
  onSelectRate: (rate: QuotedRate | null) => void;
}) {
  const qty = Math.min(30, Math.max(1, Math.floor(Number(packages) || 1)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(null);
  const selectedRef = useRef(selectedRateId);
  const onSelectRef = useRef(onSelectRate);
  selectedRef.current = selectedRateId;
  onSelectRef.current = onSelectRate;

  useEffect(() => {
    const cp = postalCode.replace(/\D/g, "").slice(0, 4);
    if (cp.length !== 4) {
      setQuote(null);
      setError("");
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      quoteCorreoShipping(cp, qty)
        .then((data) => {
          if (cancelled) return;
          setQuote(data);
          setError("");
          const selectedId = selectedRef.current;
          if (!selectedId) return;
          const next = data.rates.find((r) => r.id === selectedId) || null;
          onSelectRef.current(withQuote(next, data));
        })
        .catch((err) => {
          if (cancelled) return;
          setQuote(null);
          setError(
            err instanceof Error ? err.message : "No se pudo cotizar el envío."
          );
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [postalCode, qty]);

  return (
    <div className="mt-4">
      <label className="block text-sm">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
          Código postal *
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={4}
          value={postalCode}
          onChange={(e) =>
            onPostalCodeChange(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          placeholder="Ej. 5000"
          className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#222222]"
        />
      </label>

      {loading ? (
        <p className="mt-3 text-xs text-soft">
          {qty === 1
            ? "Cotizando Correo y Andreani…"
            : `Cotizando envío de ${qty} pares…`}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs font-medium text-brand">{error}</p>
      ) : null}

      {quote?.rates?.length ? (
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
      ) : postalCode.length === 4 && !loading && !error ? (
        <p className="mt-3 text-xs text-soft">
          No hay tarifas para ese código postal.
        </p>
      ) : postalCode.length < 4 ? (
        <p className="mt-3 text-xs text-soft">
          Ingresá tu CP y elegí Correo Argentino o Andreani.
        </p>
      ) : null}
    </div>
  );
}
