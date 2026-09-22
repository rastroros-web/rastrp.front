/** Tabla de plantilla por modelo (talle etiquetado → cm). Persistida dentro de `description`. */

export type SizeChartRow = { size: string; cm: string };

export type ParsedProductSizeChart = {
  /** Texto comercial / descripción sin la tabla. */
  body: string;
  /** Consejo de calce de este modelo. */
  fitNote: string;
  range: string | null;
  rows: SizeChartRow[];
  extras: string[];
  /** Si no hay tabla parseable, el texto completo queda acá. */
  fallback: string | null;
};

const TABLE_MARKER =
  /LARGO DE PLANTILLA|Medida de plantilla|Tabla de medidas|plantilla por talle/i;

function normalizeCm(raw: string): string {
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return String(raw).trim();
  return String(n).replace(".", ",");
}

export function parseProductSizeChart(raw: string): ParsedProductSizeChart {
  const text = String(raw || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return {
      body: "",
      fitNote: "",
      range: null,
      rows: [],
      extras: [],
      fallback: null,
    };
  }

  const tableIdx = text.search(TABLE_MARKER);
  const rows: SizeChartRow[] = [];
  const searchIn = tableIdx >= 0 ? text.slice(tableIdx) : text;
  const pairRe = /(\d{2})\s+(\d{1,2}(?:[.,]\d{1,2})?)\s*cm/gi;
  let match: RegExpExecArray | null;
  while ((match = pairRe.exec(searchIn)) !== null) {
    const size = match[1];
    const sizeN = Number(size);
    const cmN = Number(match[2].replace(",", "."));
    if (sizeN < 34 || sizeN > 43) continue;
    if (cmN < 20 || cmN > 36) continue;
    if (rows.some((r) => r.size === size)) continue;
    rows.push({ size, cm: normalizeCm(match[2]) });
  }
  rows.sort((a, b) => Number(a.size) - Number(b.size));

  let head = tableIdx >= 0 ? text.slice(0, tableIdx).trim() : text;
  const rangeMatch = head.match(/Vienen del talle\s+([^.:]+)/i);
  const range = rangeMatch ? rangeMatch[1].trim() : null;
  if (rangeMatch) {
    head = head.replace(rangeMatch[0], "").replace(/\s{2,}/g, " ").trim();
  }
  head = head.replace(/\.\s*$/, "").trim();

  const extras: string[] = [];
  const incluye = text.match(/Incluye[^.!]*/i);
  if (incluye) {
    extras.push(incluye[0].trim());
    head = head.replace(incluye[0], "").replace(/\s{2,}/g, " ").trim();
  }

  if (!rows.length) {
    return {
      body: text,
      fitNote: "",
      range: null,
      rows: [],
      extras: [],
      fallback: text,
    };
  }

  const defaultNote =
    "Te recomendamos que midas tu plantilla con centímetro o regla para elegir el talle más adecuado.";
  const fitNote = head || defaultNote;

  return {
    body: "",
    fitNote,
    range,
    rows,
    extras,
    fallback: null,
  };
}

/** Arma el texto de descripción con la tabla editable por la dueña. */
export function composeProductDescription(input: {
  body?: string;
  fitNote?: string;
  rows?: SizeChartRow[];
  extras?: string[];
}): string {
  const body = String(input.body || "").trim();
  const fitNote = String(input.fitNote || "").trim();
  const rows = (input.rows || [])
    .map((r) => ({
      size: String(r.size || "").trim(),
      cm: normalizeCm(String(r.cm || "")),
    }))
    .filter((r) => {
      const sizeN = Number(r.size);
      const cmN = Number(String(r.cm).replace(",", "."));
      return (
        Number.isFinite(sizeN) &&
        sizeN >= 34 &&
        sizeN <= 43 &&
        Number.isFinite(cmN) &&
        cmN >= 20 &&
        cmN <= 36
      );
    })
    .sort((a, b) => Number(a.size) - Number(b.size));

  const extras = (input.extras || []).map((e) => e.trim()).filter(Boolean);

  if (!rows.length) {
    return [body, fitNote, ...extras].filter(Boolean).join("\n\n");
  }

  const min = rows[0].size;
  const max = rows[rows.length - 1].size;
  const note =
    fitNote ||
    "Te recomendamos que midas tu plantilla con centímetro o regla para elegir el talle más adecuado.";

  const tableLines = [
    `Vienen del talle ${min} al ${max}.`,
    "LARGO DE PLANTILLA POR TALLE",
    ...rows.map((r) => `${r.size} ${r.cm} cm`),
  ];

  return [body, note, tableLines.join("\n"), ...extras]
    .filter(Boolean)
    .join("\n\n");
}

export function sizeChartHasTable(raw: string): boolean {
  return parseProductSizeChart(raw).rows.length > 0;
}
