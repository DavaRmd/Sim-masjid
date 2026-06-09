"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { createClient } from "@/lib/supabase/client";

// Mapping route ke judul halaman
const judulHalaman: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/pengumuman": "Pengumuman & Kegiatan",
  "/admin/jadwal-jumat": "Jadwal Sholat Jumat",
  "/admin/kepengurusan": "Kepengurusan DKM",
  "/admin/keuangan": "Keuangan",
  "/admin/laporan": "Laporan Keuangan",
  "/admin/profil-masjid": "Info Masjid",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const router = useRouter();
  const supabase = createClient();

  // Cek session saat mount — kecuali halaman login
  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      setIsLoading(false);
    };

    checkSession();
  }, [router, supabase, pathname, isLoginPage]);

  // Tutup sidebar saat rute berubah
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Tentukan judul halaman
  const judul =
    Object.entries(judulHalaman).find(([key]) => pathname.startsWith(key))?.[1] ??
    "Admin";

  // Tentukan activeMenu (cocokkan prefix terpanjang dulu)
  const activeMenu =
    Object.keys(judulHalaman)
      .filter((key) => pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] ?? "/admin/dashboard";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Halaman login: render tanpa sidebar & header
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        activeMenu={activeMenu}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:ml-[240px]">
        <AdminHeader
          judul={judul}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}