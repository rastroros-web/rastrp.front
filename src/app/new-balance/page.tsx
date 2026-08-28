import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("New Balance", "/new-balance");

export default function Page() {
  return <CategoryRoute slug="new-balance" title="New Balance" />;
}
