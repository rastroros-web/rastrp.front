/** Texto tipo Mercado Libre al compartir un producto. */
export function productSharePayload({
  name,
  variantName,
  showVariant,
  price,
  transfer,
  installments,
  url,
}: {
  name: string;
  variantName?: string;
  showVariant?: boolean;
  price: string;
  transfer: string;
  installments?: string | null;
  url: string;
}) {
  const title =
    showVariant && variantName ? `${name} · ${variantName}` : name;
  const lines = [
    "Mirá lo que encontré en Rastro",
    "",
    title,
    price,
    `${transfer} con transferencia`,
  ];
  if (installments) lines.push(`3 cuotas de ${installments}`);
  const text = lines.join("\n");
  return {
    title: "Rastro",
    text,
    url,
    full: `${text}\n\n${url}`,
  };
}
