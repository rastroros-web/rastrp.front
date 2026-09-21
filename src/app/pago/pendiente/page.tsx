import { PagoResult } from "@/components/checkout/PagoResult";

export const metadata = {
  title: "Pago pendiente",
  robots: { index: false, follow: false },
};

export default function PagoPendientePage() {
  return <PagoResult variant="pending" />;
}
