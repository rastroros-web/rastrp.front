"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AppDialog } from "@/components/ui/AlertProvider";
import { isoToArgentinaParts } from "@/lib/argentinaTime";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = [
  ...Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")),
  "59",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function parseYmd(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function argentinaToday() {
  const parts = isoToArgentinaParts(new Date().toISOString());
  return parseYmd(parts.date) ?? { year: 2026, monthIndex: 0, day: 1 };
}

function monthLabel(year: number, monthIndex: number) {
  const label = new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString(
    "es-AR",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function mondayIndex(year: number, monthIndex: number) {
  const js = new Date(year, monthIndex, 1).getDay();
  return (js + 6) % 7;
}

function splitTime(value: string): { hour: string; minute: string } {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hour: "23", minute: "59" };
  const hour = HOURS.includes(match[1]) ? match[1] : "23";
  const minute = MINUTES.includes(match[2])
    ? match[2]
    : MINUTES.reduce((best, m) =>
        Math.abs(Number(m) - Number(match[2])) <
        Math.abs(Number(best) - Number(match[2]))
          ? m
          : best
      );
  return { hour, minute };
}

function formatTrigger(date: string, time: string) {
  const parsed = parseYmd(date);
  if (!parsed) return "";
  const day = `${parsed.day}/${parsed.monthIndex + 1}/${parsed.year}`;
  return `${day} · ${time || "23:59"} ART`;
}

function Column({
  values,
  selected,
  onSelect,
  label,
}: {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
  label: string;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, [selected]);

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-center text-[10px] font-semibold tracking-[0.16em] text-soft uppercase">
        {label}
      </p>
      <div className="h-36 overflow-y-auto border border-black/10">
        {values.map((value) => {
          const active = value === selected;
          return (
            <button
              key={value}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(value)}
              className={`flex w-full items-center justify-center py-1.5 text-sm font-semibold tabular-nums transition ${
                active
                  ? "bg-[#222222] text-white"
                  : "text-[#222222] hover:bg-[#222222] hover:text-white"
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateTimePicker({
  label,
  date,
  time,
  onChange,
}: {
  label: string;
  date: string;
  time: string;
  onChange: (next: { date: string; time: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => argentinaToday(), [open]);
  const selected = parseYmd(date) ?? today;
  const [viewYear, setViewYear] = useState(selected.year);
  const [viewMonth, setViewMonth] = useState(selected.monthIndex);
  const [day, setDay] = useState(toYmd(selected.year, selected.monthIndex, selected.day));
  const clock = splitTime(time || "23:59");
  const [hour, setHour] = useState(clock.hour);
  const [minute, setMinute] = useState(clock.minute);

  useEffect(() => {
    if (!open) return;
    const base = parseYmd(date) ?? argentinaToday();
    const parts = splitTime(time || "23:59");
    setViewYear(base.year);
    setViewMonth(base.monthIndex);
    setDay(toYmd(base.year, base.monthIndex, base.day));
    setHour(parts.hour);
    setMinute(parts.minute);
  }, [open, date, time]);

  const cells = useMemo(() => {
    const first = mondayIndex(viewYear, viewMonth);
    const count = new Date(viewYear, viewMonth + 1, 0).getDate();
    const items: Array<{ ymd: string; inMonth: boolean; num: number }> = [];
    for (let i = 0; i < first; i += 1) {
      items.push({ ymd: `pad-${i}`, inMonth: false, num: 0 });
    }
    for (let d = 1; d <= count; d += 1) {
      items.push({
        ymd: toYmd(viewYear, viewMonth, d),
        inMonth: true,
        num: d,
      });
    }
    return items;
  }, [viewYear, viewMonth]);

  const display = formatTrigger(date, time);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <div className="block text-sm sm:col-span-2">
      <span className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between border bg-white px-3 py-2.5 text-left text-sm outline-none transition ${
          open ? "border-[#222222]" : "border-black/10 hover:border-[#222222]"
        }`}
      >
        <span className={display ? "tabular-nums text-[#222222]" : "text-soft"}>
          {display || "Sin vencimiento"}
        </span>
        <CalendarDays className="size-4 text-soft" />
      </button>
      <span className="mt-1 block text-[11px] text-soft">
        Fecha y hora juntas, horario Argentina (UTC-3).
      </span>

      {open ? (
        <AppDialog
          eyebrow="Vencimiento"
          title="Fecha y hora"
          message="Elegí el día y la hora en Argentina. Listo guarda ambos."
          tone="neutral"
          cancelLabel="Cancelar"
          confirmLabel="Listo"
          className="max-w-lg"
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            onChange({ date: day, time: `${hour}:${minute}` });
            setOpen(false);
          }}
        >
          <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="btn-press p-1.5 text-[#222222] hover:bg-[#f5f4f0]"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {monthLabel(viewYear, viewMonth)}
                </p>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="btn-press p-1.5 text-[#222222] hover:bg-[#f5f4f0]"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-px bg-black/10 p-px">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="bg-[#f5f4f0] py-1.5 text-center text-[9px] font-semibold tracking-[0.08em] text-soft uppercase"
                  >
                    {w}
                  </div>
                ))}
                {cells.map((cell) =>
                  cell.inMonth ? (
                    <button
                      key={cell.ymd}
                      type="button"
                      onClick={() => setDay(cell.ymd)}
                      className={`py-2 text-sm tabular-nums transition ${
                        cell.ymd === day
                          ? "bg-[#222222] font-semibold text-white"
                          : "bg-white hover:bg-[#222222] hover:text-white"
                      }`}
                    >
                      {cell.num}
                    </button>
                  ) : (
                    <div key={cell.ymd} className="bg-white" />
                  )
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Column
                label="Hora"
                values={HOURS}
                selected={hour}
                onSelect={setHour}
              />
              <Column
                label="Min"
                values={MINUTES}
                selected={minute}
                onSelect={setMinute}
              />
            </div>
          </div>
          <p className="mt-3 text-center font-display text-xl font-bold tabular-nums tracking-wide">
            {formatTrigger(day, `${hour}:${minute}`)}
          </p>
          <button
            type="button"
            onClick={() => {
              onChange({ date: "", time: "" });
              setOpen(false);
            }}
            className="mt-2 w-full text-center text-[11px] font-semibold tracking-[0.12em] text-soft uppercase underline underline-offset-2"
          >
            Quitar vencimiento
          </button>
        </AppDialog>
      ) : null}
    </div>
  );
}
