import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Términos y condiciones | RASTRO",
  description:
    "Términos y condiciones de uso de la tienda online Rastro.",
};

export default function TerminosPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Términos y condiciones"
      lead="Condiciones de uso del sitio y de las compras en la tienda online Rastro. Al navegar o comprar aceptás estas condiciones."
      sections={[
        {
          title: "1. Identificación",
          body: [
            "Rastro comercializa calzado y accesorios a través de este sitio y canales de atención asociados (WhatsApp 341 351-5773 e Instagram @rastro.ros).",
            "Puntos de retiro: Rastro Centro (Riobamba 1432, Rosario) y Rastro Sur (Mitre 5437, Rosario). Horario a coordinar al confirmar el pedido.",
          ],
        },
        {
          title: "2. Alcance",
          body: "Estos términos regulan el acceso al sitio, el catálogo, el carrito, el checkout y la relación comercial derivada de los pedidos. Si no estás de acuerdo, no uses el sitio ni realices compras.",
        },
        {
          title: "3. Productos, precios y stock",
          body: [
            "Los precios se muestran en pesos argentinos (ARS) e incluyen la información promocional vigente al momento de la compra (por ejemplo, descuento por transferencia o cuotas según medios de pago).",
            "El stock y los talles se informan según disponibilidad. Si un producto no pudiera despacharse por falta de stock, te contactamos para ofrecer cambio por otro producto, espera de reposición o anulación del pedido sin cargo.",
            "Nos reservamos el derecho de corregir errores evidentes de precio, descripción o imagen. Si el error afecta un pedido ya confirmado, te avisamos antes de continuar.",
          ],
        },
        {
          title: "4. Pedidos y pago",
          body: [
            "El pedido se confirma cuando se completa el checkout y se acredita el pago según el medio elegido (transferencia, Mercado Pago u otro disponible).",
            "En transferencia, el pedido queda pendiente hasta la acreditación. El comprobante y el concepto indicado en checkout ayudan a identificar el pago.",
            "Rastro puede cancelar pedidos con datos incompletos, sospecha de fraude o imposibilidad de cobro, reintegrando lo abonado cuando corresponda.",
          ],
        },
        {
          title: "5. Envíos y retiro",
          body: [
            "Los plazos, costos y zonas de envío se informan en checkout y en la página de Envíos. Pueden variar por destino, transportista y stock.",
            "El retiro en puntos Rastro no tiene costo de domicilio. El horario se coordina al confirmar el pedido. Debés presentar DNI y el número de pedido.",
            "Los plazos de entrega son estimativos. Demoras de terceros (correo, mensajería) o causas de fuerza mayor no generan responsabilidad adicional más allá de lo legalmente exigible.",
          ],
        },
        {
          title: "6. Cambios y garantía",
          body: "Se rigen por la política publicada en Cambios y garantía. Rastro no realiza devoluciones de dinero: solo cambios de producto o talle, sujeto a stock y a la normativa aplicable de defensa del consumidor en Argentina.",
        },
        {
          title: "7. Propiedad intelectual",
          body: "Textos, diseño, fotografías, logos y demás contenidos publicados en este sitio son de Rastro o se usan con autorización. Queda prohibido copiarlos, reproducirlos o usarlos sin permiso escrito. Las marcas de terceros mencionadas (Nike, Adidas, etc.) pertenecen a sus titulares y se citan únicamente para identificar los productos ofrecidos.",
        },
        {
          title: "8. Uso del sitio",
          body: "Te comprometés a usar el sitio de forma lícita, sin intentar vulnerar la seguridad, alterar precios o realizar compras fraudulentas. Podemos suspender cuentas o pedidos ante usos indebidos.",
        },
        {
          title: "9. Modificaciones",
          body: "Podemos actualizar estos términos. La versión vigente es la publicada en esta página. Los pedidos se rigen por los términos vigentes al momento de la compra.",
        },
        {
          title: "10. Contacto",
          body: "Consultas: WhatsApp 341 351-5773, Instagram @rastro.ros o la página de Contacto.",
        },
      ]}
    />
  );
}
