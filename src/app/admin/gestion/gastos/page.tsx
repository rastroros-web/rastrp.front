import { redirect } from "next/navigation";

export default function GestionGastosRedirectPage() {
  redirect("/admin/gestion/gastos-fijos");
}
