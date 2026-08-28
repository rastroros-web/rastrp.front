"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBusiness } from "@/components/admin/BusinessProvider";
import { useStore } from "@/components/store/StoreProvider";
import {
  AdminSectionHeader,
  AdminStat,
  AdminTableShell,
  adminTd,
  adminTh,
} from "@/components/admin/AdminSection";
import { formatMoney, uid } from "@/lib/mock/money";
import type { EcommerceRow } from "@/lib/mock/business";
import type { SyncEcommerceResult } from "@/lib/mock/syncEcommerce";
import { stockPairs } from "@/lib/mock/syncEcommerce";
import { SHEET_SIZES, cell } from "@/lib/mock/sheetCols";
import { FancySelect } from "@/components/ui/FancySelect";

const SIZES = [...SHEET_SIZES];

function EcommerceSheetTable({
  rows,
  omitEstado = false,
  priceLabels = ["Precio EF/TR", "Precio web"] as [string, string],
  marcaLabel = "Marca/Categoría",
  colorLabel = "Color/Filtro",
  onEdit,
  onDelete,
}: {
  rows: EcommerceRow[];
  omitEstado?: boolean;
  priceLabels?: [string, string];
  marcaLabel?: string;
  colorLabel?: string;
  onEdit: (row: EcommerceRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="min-w-max">
      <thead className="sticky top-0 z-10 bg-[#f5f4f0]">
        <tr>
          {omitEstado ? null : <th className={adminTh}>Estado</th>}
          <th className={adminTh}>{marcaLabel}</th>
          <th className={adminTh}>Modelo</th>
          <th className={adminTh}>{colorLabel}</th>
          <th className={adminTh}>{priceLabels[0]}</th>
          <th className={adminTh}>{priceLabels[1]}</th>
          <th className={adminTh}>Peso</th>
          <th className={adminTh}>Dimensiones envío</th>
          <th className={adminTh}>Estilo</th>
          <th className={adminTh}>Link fotos</th>
          <th className={adminTh}>Descripción/Materiales</th>
          <th className={adminTh}>Otras categorías</th>
          {SIZES.map((s) => (
            <th key={s} className={adminTh}>
              {s}
            </th>
          ))}
          <th className={adminTh} />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            {omitEstado ? null : <td className={adminTd}>{cell(r.estado)}</td>}
            <td className={adminTd}>{cell(r.marca)}</td>
            <td className={adminTd}>{cell(r.modelo)}</td>
            <td className={adminTd}>{cell(r.color)}</td>
            <td className={adminTd}>{formatMoney(r.precioEfTr)}</td>
            <td className={adminTd}>{formatMoney(r.precioWeb)}</td>
            <td className={adminTd}>{cell(r.peso)}</td>
            <td className={adminTd}>{cell(r.dimensiones)}</td>
            <td className={adminTd}>{cell(r.estilo)}</td>
            <td className={adminTd}>
              {r.linkFotos ? (
                <a
                  href={r.linkFotos}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold underline"
                >
                  Drive
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className={`${adminTd} max-w-[240px] whitespace-normal text-xs`}>
              {cell(r.descripcion)}
            </td>
            <td className={`${adminTd} max-w-[160px] whitespace-normal`}>
              {cell(r.categorias)}
            </td>
            {SIZES.map((s) => (
              <td key={s} className={adminTd}>
                {r.stock[s] ?? "—"}
              </td>
            ))}
            <td className={adminTd}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(r)}
                  className="text-[11px] font-semibold uppercase underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  className="text-[11px] font-semibold uppercase text-soft underline"
                >
                  Borrar
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function GestionEcommercePage() {
  const { ready, data, saveEcommerce, deleteEcommerce } = useBusiness();
  const { syncFromEcommerce } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "zapatilla" | "otro">("all");
  const [edit, setEdit] = useState<EcommerceRow | null>(null);
  const [syncResult, setSyncResult] = useState<SyncEcommerceResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  const rows = useMemo(() => {
    let list = data.ecommerce;
    if (filter !== "all") list = list.filter((r) => r.tipo === filter);
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.modelo.toLowerCase().includes(term) ||
        r.marca.toLowerCase().includes(term) ||
        r.color.toLowerCase().includes(term) ||
        r.categorias.toLowerCase().includes(term)
    );
  }, [data.ecommerce, q, filter]);

  const zapatillas = useMemo(
    () => rows.filter((r) => r.tipo !== "otro"),
    [rows]
  );
  const otros = useMemo(
    () => rows.filter((r) => r.tipo === "otro"),
    [rows]
  );
  const pairs = rows.reduce((s, r) => s + stockPairs(r.stock), 0);

  function startNew() {
    setEdit({
      id: uid("ecom"),
      estado: "Cargar de 0",
      marca: "",
      modelo: "",
      color: "",
      precioEfTr: 0,
      precioWeb: 0,
      peso: "1kg",
      dimensiones: "32x20x12cm",
      estilo: "Urbanas",
      linkFotos: null,
      descripcion: "",
      categorias: "",
      stock: {},
      tipo: "zapatilla",
    });
  }

  function saveEdit() {
    if (!edit || !edit.marca.trim() || !edit.modelo.trim() || !edit.color.trim()) {
      window.alert("Marca, modelo y color son obligatorios.");
      return;
    }
    const nextRows = data.ecommerce.some((r) => r.id === edit.id)
      ? data.ecommerce.map((r) => (r.id === edit.id ? edit : r))
      : [edit, ...data.ecommerce];
    saveEcommerce(edit);
    // E-commerce = stock real → sync inmediato a la tienda
    syncFromEcommerce(nextRows);
    setEdit(null);
  }

  function runSync() {
    setSyncing(true);
    try {
      const result = syncFromEcommerce(data.ecommerce);
      setSyncResult(result);
    } finally {
      setSyncing(false);
    }
  }

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="E-commerce"
        description="Stock y precios de la tienda (Postgres). Al guardar, se copian al catálogo. Si se vende online, esta hoja se actualiza sola."
        actions={
          <>
            <button
              type="button"
              onClick={runSync}
              disabled={syncing}
              className="btn-press bg-brand px-4 py-2.5 text-[11px] font-semibold text-white uppercase disabled:opacity-60"
            >
              {syncing ? "Sincronizando…" : "Sync → catálogo tienda"}
            </button>
            <button
              type="button"
              onClick={startNew}
              className="btn-press bg-[#222222] px-4 py-2.5 text-[11px] font-semibold text-white uppercase"
            >
              Nueva variante
            </button>
          </>
        }
      />

      {syncResult && (
        <div className="border border-black/5 bg-white p-4 text-sm">
          <p className="font-semibold uppercase tracking-wide">
            Sync listo
          </p>
          <p className="mt-1 text-soft">
            {syncResult.matched} variantes aplicadas · {syncResult.updatedSlugs.length}{" "}
            productos actualizados · {syncResult.unmatched.length} sin mapeo
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold uppercase">
            <Link href="/productos" className="underline">
              Ver tienda
            </Link>
            <Link href="/admin/productos" className="underline">
              Ver productos admin
            </Link>
            <Link href="/admin/stock" className="underline">
              Ver stock
            </Link>
          </div>
          {syncResult.unmatched.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase text-soft">
                Sin mapeo al catálogo ({syncResult.unmatched.length})
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-soft">
                {syncResult.unmatched.map((u) => (
                  <li key={`${u.modelo}-${u.color}`}>
                    {u.modelo} · {u.color} — {u.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <AdminStat label="Variantes" value={String(rows.length)} />
        <AdminStat label="Pares" value={String(pairs)} />
        <AdminStat
          label="Precio web prom."
          value={formatMoney(
            rows.length
              ? rows.reduce((s, r) => s + r.precioWeb, 0) / rows.length
              : 0
          )}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar marca, modelo, color, categoría…"
          className="w-full max-w-md border border-black/10 bg-white px-3 py-2.5 text-sm"
        />
        {(["all", "zapatilla", "otro"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-[11px] font-semibold uppercase ${
              filter === f
                ? "bg-[#222222] text-white"
                : "border border-black/10 bg-white"
            }`}
          >
            {f === "all" ? "Todos" : f}
          </button>
        ))}
      </div>

      {edit && (
        <div className="space-y-3 border border-black/5 bg-white p-4">
          <p className="text-sm font-semibold uppercase tracking-wide">
            {data.ecommerce.some((r) => r.id === edit.id) ? "Editar" : "Nueva"} variante
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["estado", "Estado"],
                ["marca", "Marca"],
                ["modelo", "Modelo"],
                ["color", "Color"],
                ["estilo", "Estilo"],
                ["categorias", "Categorías"],
                ["peso", "Peso"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-[11px] text-soft">
                {label}
                <input
                  value={String(edit[key] ?? "")}
                  onChange={(e) =>
                    setEdit({ ...edit, [key]: e.target.value })
                  }
                  className="mt-1 w-full border border-black/10 px-3 py-2 text-sm text-[#222222]"
                />
              </label>
            ))}
            <label className="text-[11px] text-soft">
              Precio EF/TR
              <input
                type="number"
                value={edit.precioEfTr}
                onChange={(e) =>
                  setEdit({ ...edit, precioEfTr: Number(e.target.value) })
                }
                className="mt-1 w-full border border-black/10 px-3 py-2 text-sm text-[#222222]"
              />
            </label>
            <label className="text-[11px] text-soft">
              Precio web
              <input
                type="number"
                value={edit.precioWeb}
                onChange={(e) =>
                  setEdit({ ...edit, precioWeb: Number(e.target.value) })
                }
                className="mt-1 w-full border border-black/10 px-3 py-2 text-sm text-[#222222]"
              />
            </label>
            <label className="text-[11px] text-soft">
              Dimensiones envío
              <input
                value={edit.dimensiones}
                onChange={(e) =>
                  setEdit({ ...edit, dimensiones: e.target.value })
                }
                className="mt-1 w-full border border-black/10 px-3 py-2 text-sm text-[#222222]"
              />
            </label>
            <label className="text-[11px] text-soft">
              Link fotos
              <input
                value={edit.linkFotos ?? ""}
                onChange={(e) =>
                  setEdit({ ...edit, linkFotos: e.target.value || null })
                }
                className="mt-1 w-full border border-black/10 px-3 py-2 text-sm text-[#222222]"
              />
            </label>
            <FancySelect
              label="Tipo"
              value={edit.tipo}
              options={[
                { value: "zapatilla", label: "Zapatillas" },
                { value: "otro", label: "Otros" },
              ]}
              onChange={(value) => setEdit({ ...edit, tipo: value })}
            />
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {SIZES.map((s) => (
              <label key={s} className="text-[11px] text-soft">
                {s}
                <input
                  type="number"
                  min={0}
                  value={edit.stock[s] ?? ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const stock = { ...edit.stock };
                    if (!n) delete stock[s];
                    else stock[s] = n;
                    setEdit({ ...edit, stock });
                  }}
                  className="mt-1 w-full border border-black/10 px-2 py-1.5 text-sm text-[#222222]"
                />
              </label>
            ))}
          </div>
          <label className="block text-[11px] text-soft">
            Descripción
            <textarea
              value={edit.descripcion}
              onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })}
              rows={3}
              className="mt-1 w-full border border-black/10 px-3 py-2 text-sm text-[#222222]"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="btn-press bg-[#222222] px-4 py-2 text-[11px] font-semibold text-white uppercase"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEdit(null)}
              className="btn-press border border-[#222222] px-4 py-2 text-[11px] font-semibold uppercase"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <AdminTableShell title="ZAPATILLAS">
        <EcommerceSheetTable
          rows={zapatillas}
          onEdit={(r) => setEdit(structuredClone(r))}
          onDelete={deleteEcommerce}
        />
      </AdminTableShell>

      <AdminTableShell title="OTROS">
        <EcommerceSheetTable
          rows={otros}
          omitEstado
          marcaLabel="Marca"
          colorLabel="Color"
          priceLabels={["Precio lista", "Precio oferta"]}
          onEdit={(r) => setEdit(structuredClone(r))}
          onDelete={deleteEcommerce}
        />
      </AdminTableShell>
    </div>
  );
}
