type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * `JSON.stringify` no escapa `<`. Sin esto, una descripción con `</script>`
 * cierra el bloque y deja inyectar HTML en la ficha del producto.
 */
function serializeJsonLd(data: JsonLdProps["data"]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
