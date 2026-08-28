import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contacto",
  description:
    "Contactá a Rastro por Instagram o formulario. Consultas de talles, envíos, pedidos y cambios.",
  path: "/contacto",
});

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
