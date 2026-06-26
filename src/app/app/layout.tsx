import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.mustChangePassword) redirect("/cambiar-clave");
  if (!ctx.activeOrg) redirect("/"); // resolver: residente → /portal, nuevo → /onboarding

  // El guardia solo puede estar en su inicio + garita + paquetería (server-side,
  // no solo nav). Si entra por URL a otra ruta de /app, lo regresamos.
  if (ctx.role === "guardia") {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const allowed =
      pathname === "/app" ||
      pathname.startsWith("/app/garita") ||
      pathname.startsWith("/app/paqueteria");
    if (!allowed) redirect("/app");
  }

  const orgs = ctx.memberships.map((m) => ({
    id: m.organization_id,
    name: m.org?.name ?? "Organización",
  }));

  // Módulos pagos activos de la org (para mostrar/ocultar su navegación).
  const supabase = await createClient();
  const { data: mods } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", ctx.activeOrg.id)
    .eq("enabled", true);
  const modules = (mods ?? []).map((m) => m.module_key);

  return (
    <AppShell
      brand={ctx.brand}
      orgName={ctx.activeOrg.name}
      orgType={ctx.activeOrg.type}
      role={ctx.role}
      userEmail={ctx.email}
      orgs={orgs}
      activeOrgId={ctx.activeOrg.id}
      modules={modules}
    >
      {children}
    </AppShell>
  );
}
