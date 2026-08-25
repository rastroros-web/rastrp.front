import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Nuevos ingresos");

export default function Page() {
  return <CategoryRoute slug="nuevos-ingresos" title="Nuevos ingresos" />;
}
