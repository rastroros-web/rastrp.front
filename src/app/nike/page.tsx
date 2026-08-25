import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Nike");

export default function Page() {
  return <CategoryRoute slug="nike" title="Nike" />;
}
