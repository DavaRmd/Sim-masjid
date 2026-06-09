import { redirect } from "next/navigation";

// Halaman /admin otomatis redirect ke /admin/dashboard
// Middleware akan menangani redirect ke /admin/login jika belum login
export default function AdminPage() {
  redirect("/admin/dashboard");
}
