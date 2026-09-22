const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

function partsOf(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** Convierte ISO a fecha/hora para inputs, en horario de Argentina. */
export function isoToArgentinaParts(iso?: string | null): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return partsOf(d);
}

/**
 * Interpreta fecha+hora como Argentina (UTC-3, sin DST) y devuelve ISO UTC.
 * Si hay fecha y no hora, vence a las 23:59 ART de ese día.
 */
export function argentinaDateTimeToIso(
  date: string,
  time?: string
): string | undefined {
  const day = date.trim();
  if (!day) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const clock = (time || "").trim() || "23:59";
  if (!/^\d{2}:\d{2}$/.test(clock)) return undefined;
  const iso = `${day}T${clock}:00-03:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function formatArgentinaDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", {
    timeZone: ARGENTINA_TZ,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
