import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { ShippingQuote } from "@/components/catalog/ShippingQuote";

export const metadata: Metadata = {
  title: "Envíos | RASTRO",
  description:
    "Envíos a todo el país con Correo Argentino y Andreani desde Rosario. Calculá el costo con tu código postal.",
};

export default function EnviosPage() {
  return (
    <InfoPage
      eyebrow="Más info"
      title="Envíos a todo el país"
      lead="Despachamos desde Rosario por Correo Argentino y Andreani. Ingresá tu código postal y calculá el envío al instante."
      extra={<ShippingQuote />}
      sections={[
        {
          title: "Cómo cotizar",
          body: [
            "Salimos de Rosario (CP 2000).",
            "El precio depende de tu código postal: Correo Argentino o Andreani, a domicilio o sucursal.",
            "Envío gratis a partir de $150.000, en Rosario y al interior.",
            "El tiempo de entrega no considera feriados.",
          ],
        },
        {
          title: "Interior del país",
          body: [
            "Envíos a todo el país por Correo Argentino y Andreani.",
            "Tiempo estimado: 3 a 6 días hábiles según destino.",
            "En Mega Sale los plazos pueden extenderse unos días.",
          ],
        },
        {
          title: "Rosario y alrededores — envío en el día",
          body: [
            "Si estás en Rosario y alrededores, coordinamos entrega en el día comprando antes de las 16:00 hs (días hábiles).",
            "Zonas habituales: Rosario, Funes, Roldán, Fisherton, Granadero Baigorria, Pérez, Villa Gobernador Gálvez y alrededores.",
            "Te confirmamos franja horaria por Instagram o WhatsApp al preparar el pedido.",
          ],
        },
        {
          title: "Datos obligatorios si NO sos de Rosario",
          body: [
            "Nombre y apellido completos del destinatario",
            "DNI del destinatario",
            "Teléfono / WhatsApp de contacto",
            "Email",
            "Calle y número",
            "Piso y depto (si aplica)",
            "Localidad / ciudad",
            "Provincia",
            "Código postal",
            "Referencias o notas para la entrega (opcional pero recomendado)",
          ],
        },
        {
          title: "Costo y seguimiento",
          body: "El costo se calcula con Correo Argentino y Andreani según tu CP. Al despachar te pasamos el tracking por Instagram o al contacto del pedido.",
        },
      ]}
    />
  );
}
