import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { BRAND, INSTAGRAM_HANDLE, WHATSAPP_DISPLAY } from "@/data/brand";

export const metadata: Metadata = {
  title: "Quiénes somos | RASTRO",
  description: `${BRAND.bio}. Conocé la historia de Rastro, tienda online de zapatillas desde Rosario.`,
};

export default function QuienesSomosPage() {
  return (
    <InfoPage
      eyebrow="Rastro"
      title="Quiénes somos"
      lead={`${BRAND.bio}. Somos una tienda online desde Rosario, con foco en calzado en tendencia, precios accesibles y una compra simple de punta a punta.`}
      sections={[
        {
          title: "Nuestra idea",
          body: [
            "Acercar modelos que ves en todos lados — Nike, Adidas, Vans, New Balance y más — sin rodeos ni precios inflados.",
            "Curamos el catálogo para que encuentres pares usables, con fotos reales y talles claros.",
            "Priorizamos atención cercana: te respondemos por WhatsApp e Instagram y te acompañamos en talles, envíos y cambios.",
          ],
        },
        {
          title: "Desde Rosario al país",
          body: [
            "Operamos desde Rosario con envíos a todo el país.",
            "En Rosario y alrededores ofrecemos envío en el día si comprás antes de las 16 hs.",
            "También tenés puntos de retiro para retirar sin costo de domicilio.",
          ],
        },
        {
          title: "Cómo compramos nosotros",
          body: [
            "25% OFF abonando por transferencia bancaria.",
            "Hasta 3 cuotas sin interés con tarjetas bancarizadas.",
            "Envíos a todo el país y puntos de retiro.",
            "Política de cambios clara y guía de talles para que elijas con confianza.",
          ],
        },
        {
          title: "Seguinos",
          body: `Novedades, drops y Mega Sale los publicamos primero en ${INSTAGRAM_HANDLE}. Si tenés dudas de talle o stock, escribinos por WhatsApp (${WHATSAPP_DISPLAY}): es el canal más rápido.`,
        },
      ]}
    />
  );
}
