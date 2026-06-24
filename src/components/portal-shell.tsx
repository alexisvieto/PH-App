"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Home, LogOut, MessagesSquare, QrCode } from "lucide-react";

import { type Brand, brandInitial } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

type Tab = { href: string; label: string; icon: typeof Home; exact: boolean };

export function PortalShell({
  brand,
  orgName,
  userEmail,
  accesosActive = false,
  pendingPackages = 0,
  children,
}: {
  brand: Brand;
  orgName: string;
  userEmail: string | null;
  accesosActive?: boolean;
  pendingPackages?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initial = brandInitial(brand);

  // Navegación inferior (móvil): pocas secciones, accesibles con el pulgar.
  const tabs: Tab[] = [
    { href: "/portal", label: "Inicio", icon: Home, exact: true },
    ...(accesosActive
      ? [{ href: "/portal/accesos", label: "Visitas", icon: QrCode, exact: false } as Tab]
      : []),
    { href: "/portal/quejas", label: "Quejas", icon: MessagesSquare, exact: false },
  ];

  return (
    <div
      className="flex min-h-screen flex-col"
      style={
        {
          "--brand": brand.primary,
          "--brand-soft": `color-mix(in srgb, ${brand.primary} 14%, white)`,
        } as React.CSSProperties
      }
    >
      <header className="safe-top border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/portal" className="flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: brand.primary }}
            >
              {initial}
            </span>
            <span className="font-semibold">{orgName}</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden text-xs text-muted sm:inline">{userEmail}</span>
            {accesosActive && (
              <Link
                href="/portal/paquetes"
                aria-label={`Paquetes${pendingPackages > 0 ? ` (${pendingPackages} en garita)` : ""}`}
                className="relative flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 hover:text-ink"
              >
                <Bell className="size-5" />
                {pendingPackages > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                    {pendingPackages > 9 ? "9+" : pendingPackages}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={logout}
              className="flex min-h-11 items-center gap-1.5 px-1 text-sm text-muted transition hover:text-ink"
            >
              <LogOut className="size-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* pb extra en móvil para no quedar bajo la barra inferior */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28 md:pb-6">{children}</main>

      {/* Navegación inferior (solo móvil) */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
