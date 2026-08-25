type SizeRow = { size: string; cm: string };

type ParsedDescription = {
  intro: string;
  range: string | null;
  rows: SizeRow[];
  extras: string[];
  fallback: string | null;
};

function parseDescription(raw: string): ParsedDescription {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) {
    return { intro: "", range: null, rows: [], extras: [], fallback: null };
  }

  const tableIdx = text.search(
    /LARGO DE PLANTILLA|Medida de plantilla|Tabla de medidas|plantilla por talle/i
  );

  const rows: SizeRow[] = [];
  const searchIn = tableIdx >= 0 ? text.slice(tableIdx) : text;
  const pairRe = /(\d{2})\s+(\d{1,2}(?:[.,]\d{1,2})?)\s*cm/gi;
  let match: RegExpExecArray | null;
  while ((match = pairRe.exec(searchIn)) !== null) {
    const size = match[1];
    const cmNum = match[2].replace(".", ",");
    const sizeN = Number(size);
    const cmN = Number(cmNum.replace(",", "."));
    // talle 34-50, plantilla ~20-35 cm
    if (sizeN < 34 || sizeN > 50) continue;
    if (cmN < 20 || cmN > 36) continue;
    if (rows.some((r) => r.size === size)) continue;
    rows.push({ size, cm: `${cmNum} cm` });
  }
  rows.sort((a, b) => Number(a.size) - Number(b.size));

  let intro = tableIdx >= 0 ? text.slice(0, tableIdx).trim() : text;
  const rangeMatch = intro.match(/Vienen del talle\s+([^.:]+)/i);
  const range = rangeMatch ? rangeMatch[1].trim() : null;
  if (rangeMatch) {
    intro = intro.replace(rangeMatch[0], "").replace(/\s{2,}/g, " ").trim();
  }
  intro = intro.replace(/\.\s*$/, "").trim();

  const extras: string[] = [];
  const incluye = text.match(/Incluye[^.!]*/i);
  if (incluye) {
    extras.push(incluye[0].trim());
  }

  if (!rows.length) {
    return { intro: "", range: null, rows: [], extras: [], fallback: text };
  }

  if (!intro) {
    intro =
      "Te recomendamos que midas tu plantilla con centímetro o regla para elegir el talle más adecuado.";
  }

  return { intro, range, rows, extras, fallback: null };
}

export function ProductDescription({ text }: { text: string }) {
  const parsed = parseDescription(text);

  if (parsed.fallback) {
    return (
      <div id="guia-talles" className="mt-6 max-w-lg scroll-mt-28 rounded-sm border border-black/8 bg-[#f5f4f0] px-4 py-4">
        <p className="text-sm leading-relaxed text-[#444]">{parsed.fallback}</p>
      </div>
    );
  }

  return (
    <div id="guia-talles" className="mt-6 max-w-lg scroll-mt-28 space-y-4">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
          Guía de talles
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#444]">{parsed.intro}</p>
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
              <span className="text-right tabular-nums text-[#444]">{row.cm}</span>
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
    </div>
  );
}
