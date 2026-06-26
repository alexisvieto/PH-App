"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calculator,
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
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
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

type NavGroup = { title: string; items: NavItem[] };

// Inicio (arriba) y Configuración (abajo) van fijos, fuera de los grupos.
const HOME_ITEM: NavItem = { href: "/app", label: "Inicio", icon: Home, exact: true };
const CONFIG_ITEM: NavItem = { href: "/app/configuracion", label: "Configuración", icon: Settings, exact: false };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Administración",
    items: [
      { href: "/app/edificios", label: "Edificios", icon: Building2, exact: false },
      { href: "/app/propietarios", label: "Propietarios", icon: Users, exact: false },
      { href: "/app/contabilidad", label: "Contabilidad", icon: Calculator, exact: false },
      { href: "/app/planilla", label: "Planilla", icon: Receipt, exact: false },
      { href: "/app/rrhh", label: "RRHH", icon: Users2, exact: false },
      { href: "/app/reportes", label: "Reportes", icon: FileBarChart, exact: false },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/app/mantenimiento", label: "Mantenimiento", icon: Wrench, exact: false },
      { href: "/app/anomalias", label: "Anomalías", icon: AlertTriangle, exact: false },
      { href: "/app/proveedores", label: "Proveedores", icon: Truck, exact: false },
      { href: "/app/proyectos", label: "Proyectos", icon: HardHat, exact: false },
    ],
  },
  {
    title: "Seguridad y accesos",
    items: [
      { href: "/app/accesos", label: "Accesos", icon: ShieldCheck, exact: false, module: "accesos" },
      { href: "/app/garita", label: "Garita", icon: DoorOpen, exact: false, module: "accesos" },
      { href: "/app/paqueteria", label: "Paquetería", icon: Package, exact: false, module: "accesos" },
      { href: "/app/emergencias", label: "Emergencias", icon: Siren, exact: false, module: "accesos" },
    ],
  },
  {
    title: "Servicios al propietario",
    items: [
      { href: "/app/comunicados", label: "Comunicados", icon: Megaphone, exact: false },
      { href: "/app/reservas", label: "Reservas", icon: CalendarDays, exact: false },
      { href: "/app/votaciones", label: "Votaciones", icon: Vote, exact: false },
      { href: "/app/quejas", label: "Quejas", icon: MessagesSquare, exact: false },
      { href: "/app/sanciones", label: "Sanciones", icon: Gavel, exact: false },
    ],
  },
];

const ALL_ITEMS: NavItem[] = [HOME_ITEM, ...NAV_GROUPS.flatMap((g) => g.items), CONFIG_ITEM];

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
  const isVisible = (item: NavItem) =>
    (!item.module || modules.includes(item.module)) && (!guardOnly || guardAllowed.has(item.href));
  const visibleNav = ALL_ITEMS.filter(isVisible);

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

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active ? "bg-brand-soft text-brand" : "text-ink/70 hover:bg-gray-100"
        }`}
      >
        <Icon className="size-4" />
        {item.label}
      </Link>
    );
  };

  // Menú agrupado por secciones (siempre a la vista). Una sección se oculta si
  // ninguno de sus ítems es visible (módulo inactivo / rol guardia).
  const nav = (
    <nav className="flex flex-col gap-1">
      {isVisible(HOME_ITEM) && renderItem(HOME_ITEM)}
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter(isVisible);
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="mt-4 first:mt-2">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g.title}</p>
            <div className="flex flex-col gap-1">{items.map(renderItem)}</div>
          </div>
        );
      })}
    </nav>
  );

  const configLink = isVisible(CONFIG_ITEM) ? (
    <div className="mt-3 border-t border-line pt-3">{renderItem(CONFIG_ITEM)}</div>
  ) : null;

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
    <NotificationsProvider orgId={guardOnly ? null : activeOrgId}>
    <div
      className="flex min-h-screen w-full md:h-screen md:overflow-hidden"
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
        <div className="flex items-center justify-between gap-2">
          {sidebarHead}
          {!guardOnly && <NotificationBell align="left" />}
        </div>
        {orgs.length > 1 && (
          <OrgSwitcher options={orgs} activeId={activeOrgId} />
        )}
        <div className="mt-6 flex-1 md:min-h-0 md:overflow-y-auto">{nav}</div>
        {configLink}
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
            {configLink}
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
          {!guardOnly && <NotificationBell align="right" className="ml-auto" />}
        </header>
        <main className={`flex-1 p-4 md:min-h-0 md:overflow-y-auto md:p-8 ${guardOnly ? "pb-28 md:pb-8" : ""}`}>{children}</main>
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
    </NotificationsProvider>
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
