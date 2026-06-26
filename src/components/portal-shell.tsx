"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Home, KeyRound, LogOut, Menu, Package, Siren, UsersRound, Wallet } from "lucide-react";

import { IntercomListener } from "@/components/access/intercom-listener";
import { type Brand, brandInitial } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

type Tab = { href: string; label: string; icon: typeof Home };

// Qué pestaña (hub) resaltar según la ruta: una sub-función ilumina su hub.
function tabFor(p: string): string {
  if (p === "/portal") return "/portal";
  if (/^\/portal\/(cuenta|unidades|finanzas|proyectos|recibo)/.test(p)) return "/portal/cuenta";
  if (/^\/portal\/(accesos|citofono|paquetes|sos)/.test(p)) return "/portal/accesos";
  if (/^\/portal\/(comunidad|comunicados|reservas|votaciones|quejas|a-domicilio)/.test(p)) return "/portal/comunidad";
  if (p.startsWith("/portal/mas")) return "/portal/mas";
  return "/portal";
}

export function PortalShell({
  brand,
  orgName,
  userEmail,
  orgId,
  unitIds = [],
  accesosActive = false,
  pendingPackages = 0,
  children,
}: {
  brand: Brand;
  orgName: string;
  userEmail: string | null;
  orgId: string;
  unitIds?: string[];
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

  // Navegación inferior: pocos hubs temáticos (cada uno crece por dentro).
  const tabs: Tab[] = [
    { href: "/portal", label: "Inicio", icon: Home },
    { href: "/portal/cuenta", label: "Cuenta", icon: Wallet },
    ...(accesosActive ? ([{ href: "/portal/accesos", label: "Accesos", icon: KeyRound }] as Tab[]) : []),
    { href: "/portal/comunidad", label: "Comunidad", icon: UsersRound },
    { href: "/portal/mas", label: "Más", icon: Menu },
  ];
  const activeTab = tabFor(pathname);

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
      {accesosActive && unitIds.length > 0 && <IntercomListener orgId={orgId} unitIds={unitIds} />}

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
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 hidden text-xs text-muted sm:inline">{userEmail}</span>
            {accesosActive && (
              <Link
                href="/portal/sos"
                aria-label="Emergencia · SOS"
                className="flex size-9 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
              >
                <Siren className="size-5" />
              </Link>
            )}
            {accesosActive && (
              <Link
                href="/portal/paquetes"
                aria-label={`Paquetes${pendingPackages > 0 ? ` (${pendingPackages} en garita)` : ""}`}
                className="relative flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 hover:text-ink"
              >
                <Package className="size-5" />
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

      {/* pb extra para no quedar bajo la barra inferior */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28">{children}</main>

      {/* Navegación inferior (hubs) — siempre visible, tipo app */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = activeTab === href;
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
