import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Talles bajos", "/talles-bajos");

export default function Page() {
  return <CategoryRoute slug="talles-bajos" title="Talles bajos" />;
}
