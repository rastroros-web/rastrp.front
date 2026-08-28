import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Talles altos", "/talles-altos");

export default function Page() {
  return <CategoryRoute slug="talles-altos" title="Talles altos" />;
}
