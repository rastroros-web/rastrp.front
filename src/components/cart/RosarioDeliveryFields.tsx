"use client";

import { useEffect, useMemo } from "react";
import { FancySelect } from "@/components/ui/FancySelect";

/** Entregas Rosario: después de las 16 hs. */
const SLOTS = [
  { id: "16-18", label: "16:00 a 18:00", endHour: 18 },
  { id: "18-21", label: "18:00 a 21:00", endHour: 21 },
] as const;

const DAYS_AHEAD = 21;
const TARGET_DAYS = 14;

export function slotLabel(id?: string | null) {
  return SLOTS.find((s) => s.id === id)?.label ?? "";
}

function rosarioNow() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
    })
  );
}

function toISODate(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function todayISO() {
  return toISODate(rosarioNow());
}

function tomorrowISO() {
  const d = rosarioNow();
  d.setDate(d.getDate() + 1);
  return toISODate(d);
}

function isSunday(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

/** Hoy solo si comprás antes de las 16 (envío en el día). Sin domingos. */
function slotsForDate(date: string) {
  if (!date || isSunday(date)) return [];
  if (date > todayISO()) return SLOTS.slice();
  if (date < todayISO()) return [];
  const now = rosarioNow();
  if (now.getHours() >= 16) return [];
  return SLOTS.slice();
}

function minDeliveryDate() {
  if (slotsForDate(todayISO()).length) return todayISO();
  const d = rosarioNow();
  for (let i = 0; i < 14; i += 1) {
    d.setDate(d.getDate() + 1);
    const iso = toISODate(d);
    if (!isSunday(iso)) return iso;
  }
  return tomorrowISO();
}

function formatDayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = todayISO();
  const tomorrow = tomorrowISO();
  const weekday = date.toLocaleDateString("es-AR", { weekday: "short" });
  const pretty = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  if (iso === today) return `Hoy · ${pretty}`;
  if (iso === tomorrow) return `Mañana · ${pretty}`;
  return `${weekday} · ${pretty}`;
}

function dateOptionsFrom(min: string) {
  const [y, m, d] = min.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < DAYS_AHEAD && out.length < TARGET_DAYS; i += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    const iso = toISODate(next);
    if (!slotsForDate(iso).length) continue;
    out.push({ value: iso, label: formatDayLabel(iso) });
  }
  return out;
}

export function RosarioDeliveryFields({
  date,
  slot,
  onChange,
  enabled = true,
  className = "",
}: {
  date: string;
  slot: string;
  onChange: (next: { deliveryDate?: string; deliverySlot?: string }) => void;
  /** Si false, no sincroniza estado (p. ej. panel oculto en carrito). */
  enabled?: boolean;
  className?: string;
}) {
  const min = minDeliveryDate();
  const dayOptions = useMemo(() => dateOptionsFrom(min), [min]);
  const options = slotsForDate(date || min);

  useEffect(() => {
    if (!enabled) return;
    const nextDate =
      !date || date < min || !dayOptions.some((o) => o.value === date)
        ? dayOptions[0]?.value || min
        : date;
    const nextOptions = slotsForDate(nextDate);
    const nextSlot = nextOptions.some((s) => s.id === slot) ? slot : "";
    if (nextDate !== date || nextSlot !== slot) {
      onChange({ deliveryDate: nextDate, deliverySlot: nextSlot });
    }
  }, [enabled, date, slot, min, dayOptions, onChange]);

  const slotOptions = options.map((s) => ({ value: s.id, label: s.label }));

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      <FancySelect
        label="Día disponible *"
        value={date}
        options={dayOptions}
        onChange={(value) =>
          onChange({ deliveryDate: value, deliverySlot: "" })
        }
      />
      <FancySelect
        label="Horario *"
        value={slot}
        options={slotOptions}
        placeholder="Elegí un horario"
        onChange={(value) => onChange({ deliverySlot: value })}
      />
      <p className="text-xs text-soft sm:col-span-2">
        Entregas después de las 16 hs. No hay envíos los domingos. En el día
        solo si comprás antes de las 16 hs.
      </p>
    </div>
  );
}
