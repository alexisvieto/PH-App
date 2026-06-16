import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg) redirect("/"); // resolver: residente → /portal, nuevo → /onboarding

  const orgs = ctx.memberships.map((m) => ({
    id: m.organization_id,
    name: m.org?.name ?? "Organización",
  }));

  return (
    <AppShell
      brand={ctx.brand}
      orgName={ctx.activeOrg.name}
      orgType={ctx.activeOrg.type}
      role={ctx.role}
      userEmail={ctx.email}
      orgs={orgs}
      activeOrgId={ctx.activeOrg.id}
    >
      {children}
    </AppShell>
  );
}
