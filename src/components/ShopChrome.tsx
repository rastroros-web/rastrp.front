"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageEnter } from "@/components/PageEnter";

export function ShopChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PageEnter className="flex flex-1 flex-col">{children}</PageEnter>
      <SiteFooter />
    </>
  );
}
