import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Mega Sale");

export default function Page() {
  return <CategoryRoute slug="mega-sale" title="Mega Sale" />;
}
