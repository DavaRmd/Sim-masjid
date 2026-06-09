"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi
    if (!email.trim()) {
      setError("Email tidak boleh kosong.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Email atau password salah. Silakan coba lagi.");
      setIsLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFAF0] px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {/* Ikon Masjid */}
        <div className="flex justify-center">
          <Home className="h-12 w-12 text-[#346739]" />
        </div>

        {/* Judul */}
        <h1 className="mt-4 text-center text-xl font-semibold text-[#1A1A1A]">
          Login Admin
        </h1>
        <p className="mt-1 text-center text-sm text-[#6B7280]">SIM Masjid</p>

        <Separator className="my-6" />

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@masjid.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A]"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Pesan Error */}
          {error && (
            <p className="text-sm text-[#DC2626]" role="alert">
              {error}
            </p>
          )}

          {/* Tombol Masuk */}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full bg-[#346739] text-white hover:bg-[#2A5230]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}