"use client";

import { useState, type FormEvent } from "react";
import { formatMoney } from "@/lib/mock/money";
import {
  quoteCorreoShipping,
  type ShippingQuoteResult,
  type ShippingRate,
} from "@/lib/api/backend";

const CARRIERS: {
  id: string;
  label: string;
}[] = [
  { id: "correo_argentino", label: "Correo Argentino" },
  { id: "andreani", label: "Andreani" },
];

function ratesFor(
  quote: ShippingQuoteResult,
  carrierId: string
): ShippingRate[] {
  return quote.rates.filter(
    (r) => (r.carrier || "correo_argentino") === carrierId
  );
}

export function ShippingQuote({ compact = false }: { compact?: boolean }) {
  const [cp, setCp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(null);

  const calculate = async (event?: FormEvent) => {
    event?.preventDefault();
    const postal = cp.replace(/\D/g, "").slice(0, 4);
    if (postal.length !== 4) {
      setError("Ingresá un código postal de 4 dígitos.");
      setQuote(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await quoteCorreoShipping(postal);
      setQuote(data);
    } catch (err) {
      setQuote(null);
      setError(
        err instanceof Error ? err.message : "No se pudo cotizar el envío."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "border border-black/10 bg-white p-4"
          : "border border-black/5 bg-[#f5f4f0] p-4 sm:p-5"
      }
    >
      <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
        Correo Argentino y Andreani
      </p>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide">
        Envío desde Rosario
      </p>
      <p className="mt-1 text-xs text-soft">
        Ingresá tu código postal y calculá el envío. Envío gratis desde
        $150.000. El tiempo de entrega no considera feriados.
      </p>

      <form
        onSubmit={calculate}
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch"
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={4}
          value={cp}
          onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Ej. 5000"
          aria-label="Código postal"
          className="h-11 flex-1 border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#222222]"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-press h-11 bg-[#222222] px-5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-50"
        >
          {loading ? "Calculando…" : "Calcular"}
        </button>
      </form>

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
                <ul className="mt-2 space-y-2">
                  {list.map((rate) => (
                    <li
                      key={rate.id}
                      className="flex items-baseline justify-between gap-3 border-t border-black/5 pt-2 first:border-0 first:pt-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{rate.name}</p>
                        <p className="text-[11px] text-soft">
                          {rate.daysMin} a {rate.daysMax} días hábiles. El
                          tiempo de entrega no considera feriados.
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {formatMoney(rate.price)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {quote.andreani === "unconfigured" ? (
            <p className="text-[11px] text-soft">
              Andreani se suma cuando conectemos la cuenta.
            </p>
          ) : quote.andreani === "error" ? (
            <p className="text-[11px] text-soft">
              Andreani no cotizó este CP. Probá de nuevo o usá Correo Argentino.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
