import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Últimos pares");

export default function Page() {
  return <CategoryRoute slug="ultimos-pares" title="Últimos pares" />;
}
