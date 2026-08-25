import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Converse");

export default function Page() {
  return <CategoryRoute slug="converse" title="Converse" />;
}
