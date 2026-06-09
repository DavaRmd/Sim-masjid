"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Megaphone,
  Calendar,
  Wallet,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeMenu: string;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { href: "/admin/jadwal-jumat", label: "Jadwal Jumat", icon: Calendar },
  { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/profil-masjid", label: "Info Masjid", icon: Settings },
];

export default function AdminSidebar({
  activeMenu,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header Sidebar */}
      <div className="flex h-16 items-center justify-center bg-primary">
        <span className="text-lg font-semibold text-white">SIM Masjid</span>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-light text-primary border-l-4 border-primary rounded-r-lg rounded-l-none"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Tombol Keluar */}
      <div className="border-t border-border px-3 py-4">
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] border-r border-border bg-white lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[240px] border-r border-border bg-white shadow-xl transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </div>

      {/* Dialog Konfirmasi Logout */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Keluar dari Admin</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari panel admin? Anda akan
              dialihkan ke halaman login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1"
            >
              {isLoggingOut ? "Keluar..." : "Ya, Keluar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}