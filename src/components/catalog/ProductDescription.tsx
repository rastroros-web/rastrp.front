"use client";

import { whatsappUrl, WHATSAPP_DISPLAY } from "@/data/brand";
import {
  parseProductSizeChart,
  type ParsedProductSizeChart,
} from "@/lib/productSizeChart";

function scrollToSizePicker() {
  document
    .getElementById("elegir-talle")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function HowToSteps({ modelLabel }: { modelLabel?: string }) {
  const model = modelLabel?.trim() || "este modelo";
  return (
    <ol className="mt-3 list-none space-y-2 text-sm leading-relaxed text-[#444]">
      <li className="flex gap-2">
        <span className="font-semibold tabular-nums text-brand">1.</span>
        <span>
          Medí el largo de tu plantilla (pie descalzo o plantilla de una zapa
          que te calce bien) con regla o centímetro.
        </span>
      </li>
      <li className="flex gap-2">
        <span className="font-semibold tabular-nums text-brand">2.</span>
        <span>
          Buscá ese número en cm en la tabla de{" "}
          <span className="font-semibold text-[#222]">{model}</span> (cada
          modelo calza distinto).
        </span>
      </li>
      <li className="flex gap-2">
        <span className="font-semibold tabular-nums text-brand">3.</span>
        <span>Volvé arriba y elegí ese talle para agregar al carrito.</span>
      </li>
    </ol>
  );
}

function GuideActions({ waText }: { waText: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={scrollToSizePicker}
        className="bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition hover:bg-black"
      >
        Ya sé mi talle → elegirlo
      </button>
      <a
        href={whatsappUrl(waText)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold tracking-[0.12em] text-soft uppercase underline-offset-2 hover:text-[#222222] hover:underline"
      >
        Dudás · WhatsApp {WHATSAPP_DISPLAY}
      </a>
    </div>
  );
}

export function ProductDescription({
  text,
  modelLabel,
}: {
  text: string;
  /** Ej: "Nike Air Force 1" — título de la guía de este producto. */
  modelLabel?: string;
}) {
  const parsed: ParsedProductSizeChart = parseProductSizeChart(text);
  const title = modelLabel?.trim()
    ? `Guía de talles · ${modelLabel.trim()}`
    : "Guía de talles";
  const waText = modelLabel?.trim()
    ? `Hola! Dudé del talle de ${modelLabel.trim()}. Mi plantilla mide __ cm.`
    : "Hola! Dudé del talle. Mi plantilla mide __ cm.";

  const blurb = (parsed.fallback || parsed.body || "").trim();
  const hasTable = parsed.rows.length > 0;

  if (!hasTable) {
    return (
      <div className="mt-6 max-w-lg space-y-4">
        {blurb ? (
          <div className="rounded-sm border border-black/8 bg-[#f5f4f0] px-4 py-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-soft uppercase">
              Detalle
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#444]">{blurb}</p>
          </div>
        ) : null}

        <div id="guia-talles" className="scroll-mt-28 space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
            {title}
          </p>
          <p className="text-sm leading-relaxed text-[#444]">
            Este modelo todavía no tiene tabla de plantilla en cm. Medí tu
            plantilla y escribinos por WhatsApp con la medida (o tu talle
            habitual) y te decimos cuál pedir.
          </p>
          <GuideActions waText={waText} />
        </div>
      </div>
    );
  }

  return (
    <div id="guia-talles" className="mt-6 max-w-lg scroll-mt-28 space-y-4">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
          {title}
        </p>
        <HowToSteps modelLabel={modelLabel} />
        {parsed.body ? (
          <p className="mt-3 text-sm leading-relaxed text-[#444]">{parsed.body}</p>
        ) : null}
        {parsed.fitNote ? (
          <p className="mt-2 text-sm leading-relaxed text-[#444]">
            {parsed.fitNote}
          </p>
        ) : null}
        {parsed.range && (
          <p className="mt-2 text-xs font-semibold tracking-[0.08em] text-soft uppercase">
            Disponibles: talles {parsed.range}
          </p>
        )}
      </div>

      <div className="overflow-hidden border border-black/10">
        <div className="grid grid-cols-2 bg-[#222222] px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-white uppercase">
          <span>Talle</span>
          <span className="text-right">Largo plantilla</span>
        </div>
        <ul>
          {parsed.rows.map((row, i) => (
            <li
              key={row.size}
              className={`grid grid-cols-2 px-3 py-2.5 text-sm ${
                i % 2 === 0 ? "bg-white" : "bg-[#f7f7f7]"
              }`}
            >
              <span className="font-semibold tabular-nums">{row.size}</span>
              <span className="text-right tabular-nums text-[#444]">
                {row.cm} cm
              </span>
            </li>
          ))}
        </ul>
      </div>

      {parsed.extras.length > 0 && (
        <ul className="space-y-1.5 border-t border-black/5 pt-3">
          {parsed.extras.map((extra) => (
            <li
              key={extra}
              className="flex gap-2 text-xs leading-relaxed text-[#555]"
            >
              <span className="mt-0.5 font-bold text-brand">+</span>
              <span>{extra}</span>
            </li>
          ))}
        </ul>
      )}

      <GuideActions waText={waText} />
    </div>
  );
}
