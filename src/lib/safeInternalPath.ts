/**
 * Solo acepta una ruta de esta misma app.
 * Bloquea `https://…`, `//dominio`, `javascript:` y cualquier cosa
 * que no empiece con un único `/`.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/cuenta"
): string {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.includes("://") || raw.includes("\\")) return fallback;
  return raw;
}
