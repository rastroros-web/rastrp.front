import type { TrackingCarrier } from "@/lib/mock/types";

export const TRACKING_CARRIERS: {
  id: TrackingCarrier;
  label: string;
}[] = [
  { id: "andreani", label: "Andreani" },
  { id: "correo_argentino", label: "Correo Argentino" },
  { id: "rastro", label: "Rastro (interno)" },
  { id: "otro", label: "Otro" },
];

export function carrierLabel(carrier?: TrackingCarrier | null): string {
  if (!carrier) return "Sin asignar";
  return TRACKING_CARRIERS.find((c) => c.id === carrier)?.label ?? carrier;
}

/** Links públicos de seguimiento (demo). */
export function trackingUrl(
  carrier: TrackingCarrier | undefined,
  code: string | undefined
): string | null {
  if (!code?.trim()) return null;
  const c = code.trim();
  if (carrier === "andreani") {
    return `https://www.andreani.com/#!/informacionEnvio/${encodeURIComponent(c)}`;
  }
  if (carrier === "correo_argentino") {
    return `https://www.correoargentino.com.ar/formularios/ondnc`;
  }
  return null;
}
