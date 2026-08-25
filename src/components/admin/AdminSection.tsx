"use client";

import type { ReactNode } from "react";

export function AdminSectionHeader({
  eyebrow = "Gestión",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-soft">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-black/5 bg-white p-3 sm:p-5">
      <p className="text-[9px] font-semibold tracking-[0.14em] text-soft uppercase sm:text-[10px]">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold sm:mt-2 sm:text-2xl">{value}</p>
    </div>
  );
}

export function AdminTableShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="border border-black/5 bg-white">
      {title ? (
        <div className="border-b border-black/5 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {title}
          </h2>
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export const adminTh =
  "px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.12em] text-soft uppercase whitespace-nowrap";
export const adminTd =
  "px-3 py-2.5 text-sm whitespace-nowrap border-t border-black/5";
export const adminTdWrap =
  "px-3 py-2.5 text-sm whitespace-normal break-words border-t border-black/5";
