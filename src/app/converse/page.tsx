import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Converse", "/converse");

export default function Page() {
  return <CategoryRoute slug="converse" title="Converse" />;
}
