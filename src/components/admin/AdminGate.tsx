"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store/StoreProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { BusinessProvider } from "@/components/admin/BusinessProvider";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/cuenta/login?next=/admin");
      return;
    }
    if (session.role !== "admin" && session.role !== "staff") {
      router.replace("/cuenta");
    }
  }, [ready, session, router]);

  if (!ready || !session || (session.role !== "admin" && session.role !== "staff")) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-soft">
        Verificando acceso…
      </div>
    );
  }

  return (
    <BusinessProvider>
      <AdminShell>{children}</AdminShell>
    </BusinessProvider>
  );
}
