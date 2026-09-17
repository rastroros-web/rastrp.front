import { formatMoney } from "@/lib/mock/money";
import { whatsappUrl } from "@/data/brand";

/** Shape de la API / StoreSettings (igual que Leprita). */
export type TransferBankConfig = {
  bankName: string;
  accountHolderName: string;
  cbu: string;
  alias: string;
  cuil: string;
};

/** Defaults locales si la API no responde. */
export const DEFAULT_TRANSFER_BANK: TransferBankConfig = {
  bankName: "Banco Galicia",
  accountHolderName: "Rastro Calzados SAS",
  cbu: "0070123456789012345678",
  alias: "RASTRO.ZAPAS",
  cuil: "30-71234567-8",
};

/** @deprecated Usá DEFAULT_TRANSFER_BANK / TransferBankConfig. Se mantiene por compat. */
export const TRANSFER_ACCOUNT = {
  holder: DEFAULT_TRANSFER_BANK.accountHolderName,
  bank: DEFAULT_TRANSFER_BANK.bankName,
  cbu: DEFAULT_TRANSFER_BANK.cbu,
  alias: DEFAULT_TRANSFER_BANK.alias,
  cuit: DEFAULT_TRANSFER_BANK.cuil,
} as const;

export function toDisplayAccount(config: TransferBankConfig) {
  return {
    holder: config.accountHolderName,
    bank: config.bankName,
    cbu: config.cbu,
    alias: config.alias,
    cuit: config.cuil,
  };
}

export function transferConcept(orderId: string) {
  return orderId;
}

export function transferInstructions(
  total: number,
  orderId: string,
  config: TransferBankConfig = DEFAULT_TRANSFER_BANK
) {
  return {
    ...toDisplayAccount(config),
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
