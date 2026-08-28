import { CategoryRoute, categoryMetadata } from "@/lib/category-page";

export const metadata = categoryMetadata("Samba", "/samba");

export default function Page() {
  return <CategoryRoute slug="samba" title="Samba" />;
}
