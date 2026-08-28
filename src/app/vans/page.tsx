import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Vans", "/vans");

export default function Page() {
  return <CategoryRoute slug="vans" title="Vans" />;
}
