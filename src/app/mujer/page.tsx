import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Mujer", "/mujer");

export default function Page() {
  return <CategoryRoute slug="mujer" title="Mujer" />;
}
