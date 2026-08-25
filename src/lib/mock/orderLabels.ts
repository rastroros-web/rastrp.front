function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Convierte Date / "Tue Aug 25" / ISO a YYYY-MM-DD. Texto suelto del Excel se deja. */
function fixPhantomYear(iso: string) {
  if (iso.startsWith("2001-")) {
    return `${new Date().getFullYear()}-${iso.slice(5)}`;
  }
  return iso;
}

export function ledgerFecha(
  value: string | Date | null | undefined,
  fallback?: string | null
): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return localIsoDate(value);
  }
  const raw = String(value || "").trim();
  if (!raw) return fallback !== undefined ? fallback : null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return fixPhantomYear(raw.slice(0, 10));

  if (/^[A-Za-z]{3} [A-Za-z]{3} \d{1,2}$/.test(raw)) {
    const guessed = new Date(`${raw} ${new Date().getFullYear()}`);
    if (!Number.isNaN(guessed.getTime())) return localIsoDate(guessed);
  }

  if (/\d{4}/.test(raw)) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return fixPhantomYear(localIsoDate(parsed));
    }
  }

  return fallback !== undefined ? fallback : raw;
}

function foldPart(current: string, next: unknown) {
  const a = String(current || "").replace(/\s+/g, " ").trim();
  const b = String(next || "").replace(/\s+/g, " ").trim();
  if (!b) return a;
  if (!a) return b;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return a;
  if (bl.startsWith(`${al} `) || bl.includes(al)) return b;
  if (al.startsWith(`${bl} `) || al.includes(bl)) return a;
  return `${a} ${b}`;
}

export function itemLabel(item: {
  brand?: string | null;
  productName?: string | null;
  variantName?: string | null;
}) {
  return [item?.brand, item?.productName, item?.variantName].reduce(
    (acc, part) => foldPart(acc, part),
    ""
  );
}

export function collapseLabel(text: string | null | undefined) {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  const compact: string[] = [];
  for (const word of words) {
    if (
      !compact.length ||
      compact[compact.length - 1].toLowerCase() !== word.toLowerCase()
    ) {
      compact.push(word);
    }
  }
  const n = compact.length;
  for (let len = Math.floor(n / 2); len >= 1; len -= 1) {
    for (let i = 0; i + len < n; i += 1) {
      const left = compact.slice(i, i + len).join(" ").toLowerCase();
      const right = compact.slice(i + len).join(" ").toLowerCase();
      if (right === left || right.startsWith(`${left} `)) {
        return collapseLabel(
          [...compact.slice(0, i), ...compact.slice(i + len)].join(" ")
        );
      }
    }
  }
  return compact.join(" ");
}

export function planillaDescripcion(
  articulo: string | null | undefined,
  talle?: string | null
) {
  const label = collapseLabel(articulo);
  const talleMatch = label.match(/\s*(?:·\s*)?talle\s+(\S+)/i);
  const size = talle || (talleMatch ? talleMatch[1] : null);
  const base = label
    .replace(/\s*(?:·\s*)?talle\s+\S+/i, "")
    .replace(/\s*·\s*$/g, "")
    .trim();
  return size ? `${base} · talle ${size}` : base;
}

export function splitPlanillaDescripcion(text: string | null | undefined) {
  const raw = String(text || "").trim();
  const match = raw.match(/^(.*?)\s*(?:·\s*)?talle\s+(\S+)\s*$/i);
  if (match) return { nombre: match[1].trim(), talle: match[2] };
  return { nombre: raw, talle: null as string | null };
}

export function displayFecha(value: string | Date | null | undefined) {
  const iso = ledgerFecha(value);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return value ? String(value) : "—";
  }
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
