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
  if (!ctx.activeOrg) redirect("/onboarding");

  return (
    <AppShell
      brand={ctx.brand}
      orgName={ctx.activeOrg.name}
      orgType={ctx.activeOrg.type}
      role={ctx.role}
      userEmail={ctx.email}
    >
      {children}
    </AppShell>
  );
}
