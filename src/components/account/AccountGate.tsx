"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/components/store/StoreProvider";

export function AccountGate({ children }: { children: React.ReactNode }) {
  const { ready, session } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (session) return;
    const next = pathname && pathname.startsWith("/") ? pathname : "/cuenta";
    router.replace(`/cuenta/login?next=${encodeURIComponent(next)}`);
  }, [ready, session, router, pathname]);

  if (session) return <>{children}</>;

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-soft">
      Cargando cuenta…
    </div>
  );
}
