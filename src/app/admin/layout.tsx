import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Megaphone, Sparkles, Wrench } from "lucide-react";

import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { PRODUCT_NAME } from "@/lib/brand";
import { getPlatformAdmin } from "@/lib/session";

// Panel de plataforma (Nexera). Solo accesible para platform admins.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getPlatformAdmin();
  if (!admin) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="safe-top border-b border-line bg-ink text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Sparkles className="size-5 text-emerald-400" />
          <span className="font-semibold">Nexera · Plataforma</span>
          <nav className="ml-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link href="/admin/suscriptores" className="flex items-center gap-1.5 text-white/80 hover:text-white">
              <Building2 className="size-4" /> Suscriptores
            </Link>
            <Link href="/admin/proveedores" className="flex items-center gap-1.5 text-white/80 hover:text-white">
              <Wrench className="size-4" /> Proveedores
            </Link>
            <Link href="/admin/publicidad" className="flex items-center gap-1.5 text-white/80 hover:text-white">
              <Megaphone className="size-4" /> Publicidad
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[160px] truncate text-xs text-white/50 sm:inline">{admin.email}</span>
            <AdminSignOut />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t border-line px-4 py-3 text-center text-xs text-muted">
        {PRODUCT_NAME} · panel interno de Nexera
      </footer>
    </div>
  );
}
