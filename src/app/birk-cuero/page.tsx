import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Birk cuero", "/birk-cuero");

export default function Page() {
  return <CategoryRoute slug="birk-cuero" title="Birk cuero" />;
}
