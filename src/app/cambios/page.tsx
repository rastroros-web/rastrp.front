import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Cambios y garantía | RASTRO",
  description:
    "Política de cambios y garantía de Rastro. No realizamos devoluciones de dinero.",
};

export default function CambiosPage() {
  return (
    <InfoPage
      eyebrow="Más info"
      title="Cambios y garantía"
      lead="Queremos que el par te quede perfecto. Ofrecemos cambios de producto: no realizamos devoluciones de dinero."
      sections={[
        {
          title: "Plazo de cambio",
          body: "Tenés 10 días corridos desde que recibís el pedido para solicitar un cambio. El producto tiene que estar sin uso, con caja y etiquetas.",
        },
        {
          title: "Qué se puede cambiar",
          body: [
            "Cambio de talle del mismo modelo y color, sujeto a stock.",
            "Cambio por otro producto de igual o mayor valor (se abona la diferencia).",
            "No se aceptan cambios en liquidación final o productos personalizados.",
            "No hacemos devolución del dinero: solo cambios por otro producto o talle.",
          ],
        },
        {
          title: "Cómo solicitarlo",
          body: [
            "Escribinos por WhatsApp (341 351-5773) o Instagram @rastro.ros con el número de pedido y el motivo del cambio (talle, modelo, etc.).",
            "Te confirmamos disponibilidad del talle o producto.",
            "Coordinamos la recepción del par y el reenvío (o retiro en punto).",
          ],
        },
        {
          title: "Costos de cambio",
          body: "El costo de envío del cambio lo asume el cliente, salvo error de envío nuestro o falla de fábrica. En Rosario podés acercarte a un punto de retiro coordinado.",
        },
        {
          title: "Garantía / falla de fábrica",
          body: [
            "Si el producto presenta falla de fabricación (costura, suela, pegamento) dentro de los 30 días de recibido, lo analizamos sin costo de envío a cargo tuyo.",
            "Ante falla de fábrica, el remedio es el cambio por el mismo modelo/talle o por otro de igual o mayor valor, sujeto a stock. No se reintegra dinero.",
            "No cubre desgaste por uso normal, lavado indebido ni daños por maltrato.",
            "Guardá la caja y el comprobante / número de pedido para agilizar el reclamo.",
          ],
        },
        {
          title: "Sin devolución de dinero",
          body: "Rastro no realiza devoluciones ni reintegros de dinero. Las compras se resuelven únicamente mediante cambio de producto o talle, según esta política y el stock disponible.",
        },
      ]}
    />
  );
}
