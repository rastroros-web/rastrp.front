import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Nike", "/nike");

export default function Page() {
  return <CategoryRoute slug="nike" title="Nike" />;
}
