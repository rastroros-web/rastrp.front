"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
};

export function FancySelect({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected =
    options.find((o) => o.value === value) ?? options[0] ?? { value: "", label: "" };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <span className="mb-1 block text-[10px] font-semibold tracking-[0.16em] text-soft uppercase">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`group flex w-full items-center justify-between gap-2 border bg-white px-3 py-2.5 text-left text-xs font-semibold tracking-[0.08em] text-[#222222] uppercase transition hover:text-white ${
          open
            ? "border-[#222222] shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            : "border-black/10 hover:border-[#222222]"
        }`}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 opacity-55 transition-transform duration-200 group-hover:opacity-100 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-[calc(100%+4px)] z-40 max-h-56 overflow-auto border border-[#222222] bg-white py-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold tracking-[0.06em] uppercase transition ${
                    active
                      ? "bg-[#222222] text-white"
                      : "text-[#222222] hover:bg-[#222222] hover:text-white"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && (
                    <Check className="ml-2 size-3.5 shrink-0 opacity-80" strokeWidth={2.5} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
