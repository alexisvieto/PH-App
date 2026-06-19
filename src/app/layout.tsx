import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { NativeBootstrap } from "@/components/native-bootstrap";
import { DEFAULT_BRAND, PRODUCT_NAME } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: PRODUCT_NAME,
  title: PRODUCT_NAME,
  description: `${PRODUCT_NAME} — administración de propiedad horizontal`,
  // App instalable / standalone (PWA y wrapper Capacitor en iOS).
  appleWebApp: { capable: true, statusBarStyle: "default", title: PRODUCT_NAME },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: DEFAULT_BRAND.primary,
  // Permite que el contenido use toda la pantalla y que las safe areas (notch,
  // indicador de inicio) se gestionen con env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <NativeBootstrap />
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
