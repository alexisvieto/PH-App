"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Home,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";

import type { Brand } from "@/lib/brand";
import { ORG_ROLE_LABEL, ORG_TYPE_LABEL } from "@/lib/padron";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type OrgRole = Database["public"]["Enums"]["org_role"];
type OrgType = Database["public"]["Enums"]["org_type"];

const NAV = [
  { href: "/app", label: "Inicio", icon: Home, exact: true },
  { href: "/app/edificios", label: "Edificios", icon: Building2, exact: false },
  { href: "/app/personas", label: "Personas", icon: Users, exact: false },
];

export function AppShell({
  brand,
  orgName,
  orgType,
  role,
  userEmail,
  children,
}: {
  brand: Brand;
  orgName: string;
  orgType: OrgType;
  role: OrgRole | null;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initial = (brand.name.trim()[0] ?? "P").toUpperCase();

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
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
      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        {sidebarHead}
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
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-line bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              {sidebarHead}
              <button onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1">{nav}</div>
            <UserFooter userEmail={userEmail} role={role} onLogout={logout} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Menú">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">{orgName}</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
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
