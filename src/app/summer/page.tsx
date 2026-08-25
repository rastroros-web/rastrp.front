import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Summer");

export default function Page() {
  return <CategoryRoute slug="summer" title="Summer" />;
}
