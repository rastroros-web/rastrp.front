"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Store,
  RotateCcw,
  BarChart3,
  AlertTriangle,
  Ticket,
  Briefcase,
  Receipt,
  Wallet,
  ClipboardList,
  Calculator,
  Ruler,
  ShoppingBasket,
} from "lucide-react";
import { useStore } from "@/components/store/StoreProvider";
import { useBusiness } from "@/components/admin/BusinessProvider";
import { PageEnter } from "@/components/PageEnter";

const NAV = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", short: "Prod.", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", short: "Pedidos", icon: ShoppingBag },
  { href: "/admin/reportes", label: "Reportes", short: "Stats", icon: BarChart3 },
  { href: "/admin/clientes", label: "Clientes", short: "CRM", icon: Users },
];

const OPS = [
  { href: "/admin/stock", label: "Stock bajo", icon: AlertTriangle },
  { href: "/admin/cupones", label: "Cupones", icon: Ticket },
];

const GESTION = [
  { href: "/admin/gestion", label: "Gestión", icon: Briefcase },
  { href: "/admin/gestion/ventas", label: "Ventas", icon: Receipt },
  { href: "/admin/gestion/planilla", label: "Planilla", icon: ClipboardList },
  { href: "/admin/gestion/caja", label: "Caja", icon: Wallet },
  { href: "/admin/gestion/costos", label: "Costos", icon: Calculator },
  { href: "/admin/gestion/ecommerce", label: "E-commerce", icon: ShoppingBasket },
  { href: "/admin/gestion/talles", label: "Talles cm", icon: Ruler },
  { href: "/admin/gestion/gastos-fijos", label: "Gastos fijos", icon: Calculator },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout, resetDemoData } = useStore();
  const { clearBusiness } = useBusiness();
  const isAdmin = session?.role === "admin";

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <div className="flex min-h-screen">
        {/* —— Desktop sidebar —— */}
        <aside className="hidden w-60 shrink-0 border-r border-black/5 bg-[#222222] text-white md:flex md:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <Link
              href="/"
              className="font-display text-2xl font-bold tracking-wide uppercase transition hover:text-white/80"
            >
              Rastro
            </Link>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-white/50 uppercase">
              Admin panel
            </p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold tracking-[0.08em] uppercase transition ${
                    active
                      ? "bg-white text-[#222222]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <p className="mt-3 px-3 text-[9px] font-semibold tracking-[0.16em] text-white/40 uppercase">
              Operación
            </p>
            {OPS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold tracking-[0.08em] uppercase transition ${
                    active
                      ? "bg-white text-[#222222]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <>
                <p className="mt-3 px-3 text-[9px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                  Planilla Excel
                </p>
                {GESTION.map((item) => {
                  const active =
                    item.href === "/admin/gestion"
                      ? pathname === "/admin/gestion"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold tracking-[0.08em] uppercase transition ${
                        active
                          ? "bg-white text-[#222222]"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            ) : null}
          </nav>
          <div className="space-y-1 border-t border-white/10 p-3">
            <Link
              href="/productos"
              className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold tracking-[0.08em] text-white/70 uppercase transition hover:bg-white/10 hover:text-white"
            >
              <Store className="size-4" />
              Ver tienda
            </Link>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm(
                    "Esto borra la gestión cargada y vuelve a los datos de demo de la tienda. ¿Seguís?"
                  );
                  if (!ok) return;
                  clearBusiness();
                  resetDemoData();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[12px] font-semibold tracking-[0.08em] text-white/70 uppercase transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="size-4" />
                Reset demo
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = "/cuenta/login";
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[12px] font-semibold tracking-[0.08em] text-white/70 uppercase transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
              Salir
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 md:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-soft uppercase">
                Administración
              </p>
              <p className="truncate text-sm font-medium">
                {session?.name ?? "Admin"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <Link
                href="/productos"
                className="border border-black/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase"
              >
                Tienda
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = "/cuenta/login";
                }}
                className="border border-black/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase"
              >
                Salir
              </button>
            </div>
          </header>

          <div className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
            <PageEnter>{children}</PageEnter>
          </div>
        </div>
      </div>

      {/* —— Mobile bottom tabs —— */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-black/10 bg-white [scrollbar-width:none] md:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold uppercase ${
                active ? "text-brand" : "text-soft"
              }`}
            >
              <Icon className="size-4" />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
