import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Summer", "/summer");

export default function Page() {
  return <CategoryRoute slug="summer" title="Summer" />;
}
