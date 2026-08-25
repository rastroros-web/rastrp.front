import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Samba");

export default function Page() {
  return <CategoryRoute slug="samba" title="Samba" />;
}
