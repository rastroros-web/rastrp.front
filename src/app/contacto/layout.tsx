import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | RASTRO",
  description:
    "Contactá a Rastro por Instagram o formulario. Consultas de talles, envíos, pedidos y cambios.",
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
