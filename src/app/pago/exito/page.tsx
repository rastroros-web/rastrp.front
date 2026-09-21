import { PagoResult } from "@/components/checkout/PagoResult";

export const metadata = {
  title: "Pago aprobado",
  robots: { index: false, follow: false },
};

export default function PagoExitoPage() {
  return <PagoResult variant="success" />;
}
