import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacidad | RASTRO",
  description:
    "Política de privacidad de Rastro. Tratamiento de datos personales conforme a la ley argentina.",
};

export default function PrivacidadPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacidad"
      lead="Cómo tratamos tus datos personales al usar la tienda online Rastro, de acuerdo con la Ley 25.326 de Protección de los Datos Personales y normas complementarias."
      sections={[
        {
          title: "Responsable",
          body: "Rastro es responsable del tratamiento de los datos que nos brindás al crear una cuenta, comprar, consultar o navegar el sitio. Contacto: WhatsApp 341 351-5773, Instagram @rastro.ros o la página de Contacto.",
        },
        {
          title: "Datos que usamos",
          body: [
            "Identificación y contacto: nombre, email, teléfono y dirección de envío o retiro.",
            "Pedidos: productos, talles, montos, cupones, medio de pago y datos de envío o punto de retiro.",
            "Cuenta y preferencias: carrito, favoritos y productos vistos, cuando correspondan al funcionamiento del sitio.",
            "Datos técnicos básicos del navegador necesarios para seguridad y operación del sitio.",
          ],
        },
        {
          title: "Finalidad",
          body: [
            "Gestionar pedidos, pagos, envíos, retiros y postventa (cambios, garantía).",
            "Crear y administrar tu cuenta de cliente.",
            "Contactarte por el estado del pedido, consultas o incidencias.",
            "Mejorar la experiencia de compra (por ejemplo, recordatorios de carrito o productos recientes).",
            "Cumplir obligaciones legales, fiscales y de defensa del consumidor.",
          ],
        },
        {
          title: "Base legal",
          body: "Tratamos tus datos para ejecutar el contrato de compraventa, cumplir obligaciones legales y, cuando corresponde, con tu consentimiento (por ejemplo, cookies no esenciales o comunicaciones comerciales opt-in).",
        },
        {
          title: "Conservación",
          body: "Conservamos los datos el tiempo necesario para gestionar la relación comercial, atender reclamos y cumplir plazos legales (impositivos y de consumo). Luego se eliminan o anonimizan cuando corresponda.",
        },
        {
          title: "Cesión a terceros",
          body: [
            "Podemos compartir datos estrictamente necesarios con: pasarelas de pago (p. ej. Mercado Pago), bancos para acreditar transferencias, y transportistas / mensajerías para la entrega.",
            "No vendemos tus datos personales.",
          ],
        },
        {
          title: "Tus derechos",
          body: "Podés solicitar acceso, actualización, corrección o baja de tus datos por WhatsApp (341 351-5773), Instagram @rastro.ros o Contacto, sujeto a las excepciones legales. También podés reclamar ante la Agencia de Acceso a la Información Pública (AAIP) si lo considerás necesario.",
        },
        {
          title: "Seguridad",
          body: "Aplicamos medidas razonables de seguridad para proteger la información. Ningún sistema es 100% infalible; te pedimos cuidar tu contraseña y no compartir accesos.",
        },
        {
          title: "Cookies",
          body: "Usamos cookies y almacenamiento local según se detalla en la Política de cookies. Podés gestionar tu preferencia desde el banner o la configuración del navegador.",
        },
      ]}
    />
  );
}
