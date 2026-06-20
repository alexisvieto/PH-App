import Link from "next/link";
import { notFound } from "next/navigation";
import { Megaphone, Sparkles } from "lucide-react";

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
          <nav className="ml-6 flex items-center gap-4 text-sm">
            <Link href="/admin/publicidad" className="flex items-center gap-1.5 text-white/80 hover:text-white">
              <Megaphone className="size-4" /> Publicidad
            </Link>
          </nav>
          <span className="ml-auto truncate text-xs text-white/50">{admin.email}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t border-line px-4 py-3 text-center text-xs text-muted">
        {PRODUCT_NAME} · panel interno de Nexera
      </footer>
    </div>
  );
}
