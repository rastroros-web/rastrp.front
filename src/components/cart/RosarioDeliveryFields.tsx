"use client";

import { useEffect } from "react";

const SLOTS = [
  { id: "9-13", label: "9:00 a 13:00", endHour: 13 },
  { id: "13-18", label: "13:00 a 18:00", endHour: 18 },
  { id: "18-21", label: "18:00 a 21:00", endHour: 21 },
] as const;

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

function slotsForDate(date: string) {
  if (!date || date > todayISO()) return SLOTS.slice();
  if (date < todayISO()) return [];
  const now = rosarioNow();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  return SLOTS.filter((s) => currentHour < s.endHour);
}

function minDeliveryDate() {
  return slotsForDate(todayISO()).length ? todayISO() : tomorrowISO();
}

export function RosarioDeliveryFields({
  date,
  slot,
  onChange,
}: {
  date: string;
  slot: string;
  onChange: (next: { deliveryDate?: string; deliverySlot?: string }) => void;
}) {
  const min = minDeliveryDate();
  const options = slotsForDate(date || min);

  useEffect(() => {
    const nextDate = !date || date < min ? min : date;
    const nextOptions = slotsForDate(nextDate);
    const nextSlot = nextOptions.some((s) => s.id === slot) ? slot : "";
    if (nextDate !== date || nextSlot !== slot) {
      onChange({ deliveryDate: nextDate, deliverySlot: nextSlot });
    }
  }, [date, slot, min, onChange]);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
          Día disponible *
        </span>
        <input
          type="date"
          required
          min={min}
          value={date}
          onChange={(e) =>
            onChange({ deliveryDate: e.target.value, deliverySlot: "" })
          }
          className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#222222]"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
          Horario *
        </span>
        <select
          required
          value={slot}
          onChange={(e) => onChange({ deliverySlot: e.target.value })}
          className="h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#222222]"
        >
          <option value="">Elegí un horario</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-soft sm:col-span-2">
        Indicá cuándo podés recibir en Rosario. El tiempo de entrega no
        considera feriados.
      </p>
    </div>
  );
}
