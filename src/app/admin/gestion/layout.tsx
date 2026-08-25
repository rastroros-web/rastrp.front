"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store/StoreProvider";

export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, session } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (session?.role !== "admin") {
      router.replace("/admin");
    }
  }, [ready, session, router]);

  if (!ready || session?.role !== "admin") {
    return (
      <div className="py-12 text-center text-sm text-soft">
        Redirigiendo…
      </div>
    );
  }

  return children;
}
