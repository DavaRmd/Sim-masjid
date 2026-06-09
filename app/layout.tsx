import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "#346739",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SIM Masjid — Sistem Informasi Masjid",
  description:
    "Website informasi & keuangan masjid untuk DKM dan jamaah. Transparan, mudah digunakan, dan dapat diinstall seperti aplikasi di HP.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIM Masjid",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", plusJakartaSans.variable)}>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
(function() {
  if (typeof window === "undefined") return;
  var _origOnError = window.onerror;
  var _origOnUnhandled = window.onunhandledrejection;
  function isExtensionSource(src) {
    return src && (src.indexOf("chrome-extension://") === 0 || src.indexOf("moz-extension://") === 0);
  }
  function isExtensionRejection(reason) {
    return reason && reason.stack && (reason.stack.indexOf("chrome-extension://") !== -1 || reason.stack.indexOf("moz-extension://") !== -1);
  }
  window.onerror = function(msg, src, line, col, err) {
    if (isExtensionSource(src)) { console.debug("[SIM Masjid] Abaikan error ekstensi:", src); return true; }
    if (_origOnError) return _origOnError.apply(this, arguments);
    return false;
  };
  window.addEventListener("unhandledrejection", function(ev) {
    if (isExtensionRejection(ev.reason)) { console.debug("[SIM Masjid] Abaikan rejection ekstensi"); ev.preventDefault(); ev.stopPropagation(); }
  }, { capture: true });
})();
              `.trim(),
            }}
          />
        )}
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              success: "bg-[#16A34A] text-white border-none",
              error: "bg-[#DC2626] text-white border-none",
              warning: "bg-[#D97706] text-white border-none",
            },
          }}
        />
      </body>
    </html>
  );
}
