import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Adidas", "/adidas");

export default function Page() {
  return <CategoryRoute slug="adidas" title="Adidas" />;
}
