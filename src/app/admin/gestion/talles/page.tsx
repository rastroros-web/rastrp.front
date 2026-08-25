"use client";

import { useBusiness } from "@/components/admin/BusinessProvider";
import {
  AdminSectionHeader,
  AdminTableShell,
  adminTd,
  adminTh,
} from "@/components/admin/AdminSection";
import { SHEET_SIZES, cell } from "@/lib/mock/sheetCols";

export default function GestionTallesPage() {
  const { ready, data } = useBusiness();

  if (!ready) return <p className="text-sm text-soft">Cargando…</p>;

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Talles (cm)"
        description={`Hoja TALLES completa · ${data.talles.length} modelos · medidas en cm`}
      />

      <AdminTableShell title="TALLES (todas las columnas)">
        <table className="min-w-max">
          <thead className="bg-[#f5f4f0]">
            <tr>
              <th className={adminTh}>Modelo</th>
              {SHEET_SIZES.map((s) => (
                <th key={s} className={adminTh}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.talles.map((t) => (
              <tr key={t.id}>
                <td className={adminTd}>{cell(t.modelo)}</td>
                {SHEET_SIZES.map((s) => (
                  <td key={s} className={adminTd}>
                    {cell(t.medidas[s])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableShell>
    </div>
  );
}
