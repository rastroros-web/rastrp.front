"use client";

export function AdBar() {
  const text =
    "25% OFF TRANSFERENCIA · 3 CUOTAS SIN INTERÉS";

  return (
    <div className="h-[var(--adbar-height)] overflow-hidden bg-adbar text-white">
      <div className="flex h-full items-center">
        <div className="adbar-track flex w-max items-center whitespace-nowrap">
          <span className="px-4 text-[10px] font-semibold leading-none tracking-[0.14em] uppercase md:text-[11px]">
            {text}
          </span>
          <span
            aria-hidden
            className="px-4 text-[10px] font-semibold leading-none tracking-[0.14em] uppercase md:text-[11px]"
          >
            {text}
          </span>
          <span
            aria-hidden
            className="px-4 text-[10px] font-semibold leading-none tracking-[0.14em] uppercase md:text-[11px]"
          >
            {text}
          </span>
          <span
            aria-hidden
            className="px-4 text-[10px] font-semibold leading-none tracking-[0.14em] uppercase md:text-[11px]"
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
