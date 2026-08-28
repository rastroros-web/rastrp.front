import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Liquidación", "/liquidacion");

export default function Page() {
  return <CategoryRoute slug="liquidacion" title="Liquidación" />;
}
