import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Hombre", "/hombre");

export default function Page() {
  return <CategoryRoute slug="hombre" title="Hombre" />;
}
