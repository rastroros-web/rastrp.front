import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Puma", "/puma");

export default function Page() {
  return <CategoryRoute slug="puma" title="Puma" />;
}
