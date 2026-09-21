import { PagoResult } from "@/components/checkout/PagoResult";

export const metadata = {
  title: "Pago rechazado",
  robots: { index: false, follow: false },
};

export default function PagoRechazadoPage() {
  return <PagoResult variant="failure" />;
}
