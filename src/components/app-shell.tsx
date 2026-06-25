"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  DoorOpen,
  FileBarChart,
  Gavel,
  HardHat,
  ShieldCheck,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Package,
  Receipt,
  Settings,
  Siren,
  Truck,
  Users,
  Users2,
  Vote,
  Wrench,
  X,
} from "lucide-react";

import { PanicListener } from "@/components/access/panic-listener";
import { OrgSwitcher, type OrgOption } from "@/components/org-switcher";
import type { Brand } from "@/lib/brand";
import { ORG_ROLE_LABEL, ORG_TYPE_LABEL } from "@/lib/padron";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type OrgRole = Database["public"]["Enums"]["org_role"];
type OrgType = Database["public"]["Enums"]["org_type"];

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact: boolean;
  module?: string; // si está, el item solo se muestra con ese módulo pago activo
};

const NAV: NavItem[] = [
  { href: "/app", label: "Inicio", icon: Home, exact: true },
  { href: "/app/edificios", label: "Edificios", icon: Building2, exact: false },
  { href: "/app/propietarios", label: "Propietarios", icon: Users, exact: false },
  { href: "/app/comunicados", label: "Comunicados", icon: Megaphone, exact: false },
  { href: "/app/reservas", label: "Reservas", icon: CalendarDays, exact: false },
  { href: "/app/votaciones", label: "Votaciones", icon: Vote, exact: false },
  { href: "/app/quejas", label: "Quejas", icon: MessagesSquare, exact: false },
  { href: "/app/sanciones", label: "Sanciones", icon: Gavel, exact: false },
  { href: "/app/accesos", label: "Accesos", icon: ShieldCheck, exact: false, module: "accesos" },
  { href: "/app/garita", label: "Garita", icon: DoorOpen, exact: false, module: "accesos" },
  { href: "/app/paqueteria", label: "Paquetería", icon: Package, exact: false, module: "accesos" },
  { href: "/app/emergencias", label: "Emergencias", icon: Siren, exact: false, module: "accesos" },
  { href: "/app/mantenimiento", label: "Mantenimiento", icon: Wrench, exact: false },
  { href: "/app/anomalias", label: "Anomalías", icon: AlertTriangle, exact: false },
  { href: "/app/proveedores", label: "Proveedores", icon: Truck, exact: false },
  { href: "/app/rrhh", label: "RRHH", icon: Users2, exact: false },
  { href: "/app/planilla", label: "Planilla", icon: Receipt, exact: false },
  { href: "/app/proyectos", label: "Proyectos", icon: HardHat, exact: false },
  { href: "/app/reportes", label: "Reportes", icon: FileBarChart, exact: false },
  { href: "/app/configuracion", label: "Configuración", icon: Settings, exact: false },
];

export function AppShell({
  brand,
  orgName,
  orgType,
  role,
  userEmail,
  orgs,
  activeOrgId,
  modules = [],
  children,
}: {
  brand: Brand;
  orgName: string;
  orgType: OrgType;
  role: OrgRole | null;
  userEmail: string | null;
  orgs: OrgOption[];
  activeOrgId: string;
  modules?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // El guardia solo ve Inicio + Garita (rol acotado).
  const guardOnly = role === "guardia";
  const guardAllowed = new Set(["/app", "/app/garita", "/app/paqueteria"]);
  const visibleNav = NAV.filter(
    (item) =>
      (!item.module || modules.includes(item.module)) &&
      (!guardOnly || guardAllowed.has(item.href)),
  );

  // Bloquea el scroll del contenido detrás del drawer móvil mientras está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initial = (brand.name.trim()[0] ?? "P").toUpperCase();

  const nav = (
    <nav className="flex flex-col gap-1">
      {visibleNav.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-soft text-brand"
                : "text-ink/70 hover:bg-gray-100"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarHead = (
    <div className="flex items-center gap-3 px-1">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ background: brand.primary }}
      >
        {initial}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{orgName}</p>
        <p className="truncate text-xs text-muted">{ORG_TYPE_LABEL[orgType]}</p>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen w-full"
      style={
        {
          "--brand": brand.primary,
          "--brand-soft": `color-mix(in srgb, ${brand.primary} 14%, white)`,
        } as React.CSSProperties
      }
    >
      {/* SOS en vivo: avisa al staff en cualquier parte de la app */}
      {modules.includes("accesos") && <PanicListener orgId={activeOrgId} />}

      {/* Sidebar escritorio */}
      <aside className="safe-top hidden w-64 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        {sidebarHead}
        {orgs.length > 1 && (
          <OrgSwitcher options={orgs} activeId={activeOrgId} />
        )}
        <div className="mt-6 flex-1">{nav}</div>
        <UserFooter userEmail={userEmail} role={role} onLogout={logout} />
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="safe-top absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col overflow-y-auto border-r border-line bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              {sidebarHead}
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="-mr-2 p-2">
                <X className="size-5" />
              </button>
            </div>
            {orgs.length > 1 && (
              <OrgSwitcher options={orgs} activeId={activeOrgId} />
            )}
            <div className="mt-4 flex-1">{nav}</div>
            <UserFooter userEmail={userEmail} role={role} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-top flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Menú" className="-ml-2 p-2">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">{orgName}</span>
        </header>
        <main className={`flex-1 p-4 md:p-8 ${guardOnly ? "pb-28 md:pb-8" : ""}`}>{children}</main>
      </div>

      {/* Navegación inferior para el guardia (móvil): pocas opciones, táctil. */}
      {guardOnly && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface md:hidden">
          <div className="flex items-stretch justify-around">
            {visibleNav.map(({ href, label, icon: Icon, exact }) => {
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
      )}
    </div>
  );
}

function UserFooter({
  userEmail,
  role,
  onLogout,
}: {
  userEmail: string | null;
  role: OrgRole | null;
  onLogout: () => void;
}) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="truncate text-xs font-medium">{userEmail}</p>
      {role && <p className="text-xs text-muted">{ORG_ROLE_LABEL[role]}</p>}
      <button
        onClick={onLogout}
        className="mt-2 flex items-center gap-2 text-xs text-muted transition hover:text-ink"
      >
        <LogOut className="size-3.5" /> Cerrar sesión
      </button>
    </div>
  );
}
