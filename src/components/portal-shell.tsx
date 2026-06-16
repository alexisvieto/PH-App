"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

import type { Brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

export function PortalShell({
  brand,
  orgName,
  userEmail,
  children,
}: {
  brand: Brand;
  orgName: string;
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initial = (brand.name.trim()[0] ?? "P").toUpperCase();

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
      <header className="border-b border-line bg-surface">
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
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{userEmail}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
            >
              <LogOut className="size-4" /> Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
