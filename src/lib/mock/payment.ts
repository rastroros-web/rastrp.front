import { formatMoney } from "@/lib/mock/money";
import { whatsappUrl } from "@/data/brand";

/** Datos bancarios para pago por transferencia */
export const TRANSFER_ACCOUNT = {
  holder: "Rastro Calzados SAS",
  bank: "Banco Galicia",
  cbu: "0070123456789012345678",
  alias: "RASTRO.ZAPAS",
  cuit: "30-71234567-8",
} as const;

export function transferConcept(orderId: string) {
  return orderId;
}

export function transferInstructions(total: number, orderId: string) {
  return {
    ...TRANSFER_ACCOUNT,
    amount: formatMoney(total),
    amountRaw: total,
    concept: transferConcept(orderId),
  };
}

export function transferComprobanteWhatsAppUrl(orderId: string, total: number) {
  return whatsappUrl(
    `Hola! Te envío el comprobante de transferencia del pedido ${orderId} por ${formatMoney(total)}.`
  );
}
