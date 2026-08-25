import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Cookies | RASTRO",
  description:
    "Política de cookies y almacenamiento local de la tienda Rastro.",
};

export default function CookiesPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Cookies"
      lead="Usamos cookies propias y almacenamiento del navegador para que el sitio funcione, recordar tu sesión y mejorar la compra."
      sections={[
        {
          title: "Qué son",
          body: "Las cookies y el almacenamiento local son pequeños archivos o datos que el sitio guarda en tu dispositivo. Nos ayudan a mantener el carrito, la sesión y tus preferencias.",
        },
        {
          title: "Qué usamos",
          body: [
            "Esenciales: login, sesión, carrito, checkout y preferencia de cookies. Sin ellas la tienda no puede operar de forma segura.",
            "Funcionales: favoritos, productos vistos recientemente y preferencias de navegación.",
            "No usamos cookies de publicidad de terceros en esta tienda, salvo que se indique expresamente en el futuro.",
          ],
        },
        {
          title: "Preferencia",
          body: "Al entrar podés aceptar todas o quedarte solo con las esenciales. Podés cambiar de opinión borrando los datos del sitio desde la configuración del navegador.",
        },
        {
          title: "Cómo borrarlas",
          body: "Desde la configuración del navegador (historial / datos del sitio / cookies). Al borrarlas podés perder el carrito o la sesión iniciada.",
        },
        {
          title: "Más info",
          body: "Ver también la Política de privacidad y los Términos y condiciones.",
        },
      ]}
    />
  );
}
