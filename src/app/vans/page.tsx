import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Vans");

export default function Page() {
  return <CategoryRoute slug="vans" title="Vans" />;
}
