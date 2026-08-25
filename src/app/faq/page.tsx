import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | RASTRO",
  description:
    "FAQ de Rastro: talles, envíos, pagos, cambios y cupones de descuento.",
};

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Preguntas frecuentes"
      lead="Todo lo que necesitás saber antes de comprar. Si no está acá, escribinos por WhatsApp o Instagram."
      sections={[
        {
          title: "¿Los talles son reales?",
          body: "Sí. Te recomendamos medir la plantilla y usar nuestra guía de talles. Si dudás entre dos, escribinos por WhatsApp (341 351-5773) con tu talle habitual.",
        },
        {
          title: "¿Cómo pago?",
          body: [
            "Transferencia bancaria / depósito: 25% OFF automático.",
            "Mercado Pago: hasta 3 cuotas sin interés (según promoción vigente).",
          ],
        },
        {
          title: "¿Cuánto tarda el envío?",
          body: [
            "Rosario y alrededores: en el día si comprás antes de las 16 hs.",
            "Interior: 3 a 7 días hábiles según destino.",
            "El tiempo de entrega no considera feriados.",
            "También podés retirar en puntos de retiro sin costo de domicilio.",
          ],
        },
        {
          title: "¿Puedo cambiar?",
          body: "Sí, dentro de la política de cambios (talle o producto, sujeto a stock). El calzado debe estar sin uso, con caja y etiquetas. No hacemos devolución de dinero. Ver detalle en Cambios y garantía.",
        },
        {
          title: "¿Hay cupones?",
          body: [
            "Sí, según promoción vigente. Podés aplicarlos en el carrito o checkout.",
            "Al registrarte tenés el cupón BIENVENIDA: 10% OFF (1 uso por usuario).",
          ],
        },
      ]}
    />
  );
}
