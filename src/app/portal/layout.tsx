import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { getResidentContext } from "@/lib/session";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const res = await getResidentContext();
  if (!res) redirect("/login");
  // Sin unidades vinculadas → lo resuelve la raíz (staff/onboarding) o queda fuera.
  if (res.units.length === 0) redirect("/");

  return (
    <PortalShell
      brand={res.brand}
      orgName={res.orgName ?? res.brand.name}
      userEmail={res.email}
    >
      {children}
    </PortalShell>
  );
}
