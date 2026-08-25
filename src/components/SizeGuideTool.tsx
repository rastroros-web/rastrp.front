"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SIZE_BRANDS,
  SIZE_CHARTS,
  suggestSize,
  type SizeGender,
} from "@/lib/mock/sizeGuide";

export function SizeGuideTool({
  initialBrand,
}: {
  initialBrand?: string;
}) {
  const [brand, setBrand] = useState(
    initialBrand && SIZE_BRANDS.includes(initialBrand)
      ? initialBrand
      : SIZE_BRANDS[0]
  );
  const [gender, setGender] = useState<SizeGender>("unisex");
  const [cm, setCm] = useState("25.0");

  const chartsForBrand = useMemo(
    () => SIZE_CHARTS.filter((c) => c.brand === brand),
    [brand]
  );

  const genders = useMemo(
    () => [...new Set(chartsForBrand.map((c) => c.gender))],
    [chartsForBrand]
  );

  const chart = useMemo(() => {
    return (
      chartsForBrand.find((c) => c.gender === gender) ??
      chartsForBrand[0] ??
      null
    );
  }, [chartsForBrand, gender]);

  const cmNum = Number(String(cm).replace(",", "."));
  const suggestion =
    chart && Number.isFinite(cmNum) && cmNum > 0
      ? suggestSize(chart, cmNum)
      : null;

  return (
    <div className="space-y-6">
      <div className="border border-black/5 bg-white p-5 md:p-6">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
          Calculadora
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
          Encontrá tu talle
        </h2>
        <p className="mt-2 text-sm text-soft">
          Medí tu plantilla en cm y elegí marca + género. Es una guía
          orientativa: cada modelo puede variar un poco.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Marca / modelo
            </span>
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                const next = SIZE_CHARTS.filter((c) => c.brand === e.target.value);
                setGender(next[0]?.gender ?? "unisex");
              }}
              className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none"
            >
              {SIZE_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Género
            </span>
            <select
              value={chart?.gender ?? gender}
              onChange={(e) => setGender(e.target.value as SizeGender)}
              className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none"
            >
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
              Plantilla (cm)
            </span>
            <input
              type="number"
              step="0.1"
              min="20"
              max="32"
              value={cm}
              onChange={(e) => setCm(e.target.value)}
              className="w-full border border-black/10 bg-white px-3 py-2.5 text-sm outline-none"
            />
          </label>
        </div>

        {suggestion && chart && (
          <div className="mt-6 border border-[#16a34a]/25 bg-[#16a34a]/5 px-4 py-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#16a34a] uppercase">
              Talle sugerido
            </p>
            <p className="mt-1 font-display text-4xl font-bold tracking-wide">
              {suggestion.size}
            </p>
            <p className="mt-2 text-sm text-[#166534]">
              {chart.brand} · {chart.gender}
              {!suggestion.exact ? " · aproximación (fuera de tabla)" : ""}
            </p>
            <p className="mt-2 text-xs text-soft">{chart.note}</p>
            <Link
              href={`/productos?q=${encodeURIComponent(chart.brand)}`}
              className="btn-press mt-4 inline-flex bg-[#222222] px-4 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
            >
              Ver {chart.brand} en catálogo
            </Link>
          </div>
        )}
      </div>

      {chart && (
        <div className="overflow-x-auto border border-black/5 bg-white">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-[#f5f4f0] text-[10px] tracking-[0.12em] text-soft uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Plantilla (cm)</th>
                <th className="px-4 py-3 font-semibold">Talle AR</th>
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((r) => {
                const active =
                  suggestion?.size === r.size &&
                  Number.isFinite(cmNum) &&
                  cmNum >= r.cmMin &&
                  cmNum <= r.cmMax;
                return (
                  <tr
                    key={`${r.size}-${r.cmMin}`}
                    className={`border-t border-black/5 ${
                      active ? "bg-brand/10 font-semibold" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {r.cmMin.toFixed(1)} – {r.cmMax.toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5">{r.size}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-black/5 px-4 py-3 text-xs text-soft">
            {chart.note}
          </p>
        </div>
      )}
    </div>
  );
}
