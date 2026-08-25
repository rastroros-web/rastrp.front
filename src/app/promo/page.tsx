import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Promo");

export default function Page() {
  return <CategoryRoute slug="promo" title="Promo" />;
}
