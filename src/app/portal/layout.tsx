import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const res = await getResidentContext();
  if (!res) redirect("/login");
  // Sin unidades vinculadas → lo resuelve la raíz (staff/onboarding) o queda fuera.
  if (res.units.length === 0 || !res.orgId) redirect("/");

  // ¿El módulo de accesos (add-on pago) está activo? Decide el ítem de visitas
  // en la navegación inferior.
  const supabase = await createClient();
  const { data: accesosMod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", res.orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();

  // Aviso de paquetes en garita (campanita): paquetes pendientes de sus unidades.
  let pendingPackages = 0;
  const unitIds = res.units.map((u) => u.id);
  if (accesosMod && unitIds.length > 0) {
    const { count } = await supabase
      .from("packages")
      .select("id", { count: "exact", head: true })
      .in("unit_id", unitIds)
      .eq("status", "en_garita");
    pendingPackages = count ?? 0;
  }

  return (
    <PortalShell
      brand={res.brand}
      orgName={res.orgName ?? res.brand.name}
      userEmail={res.email}
      accesosActive={!!accesosMod}
      pendingPackages={pendingPackages}
    >
      {children}
    </PortalShell>
  );
}
