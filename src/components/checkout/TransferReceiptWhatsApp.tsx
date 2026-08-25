import { transferComprobanteWhatsAppUrl } from "@/lib/mock/payment";

export function TransferReceiptWhatsApp({
  orderId,
  total,
}: {
  orderId: string;
  total: number;
}) {
  return (
    <div>
      <a
        href={transferComprobanteWhatsAppUrl(orderId, total)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-press inline-flex w-full items-center justify-center bg-[#128C7E] px-5 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-white uppercase"
      >
        Enviar comprobante por WhatsApp
      </a>
      <p className="mt-2 text-center text-xs text-soft">
        Se abre el chat con el n° de pedido. Adjuntá la captura del comprobante.
      </p>
    </div>
  );
}
