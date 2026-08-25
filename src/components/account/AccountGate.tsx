"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store/StoreProvider";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/cuenta/login?next=/cuenta");
  }, [ready, session, router]);

  if (session) return <>{children}</>;

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-soft">
      Cargando cuenta…
    </div>
  );
}
