import { redirect } from "next/navigation";

import { getResidentContext, getSessionContext } from "@/lib/session";

/** Resolver post-login: staff → /app, propietario → /portal, nuevo → /onboarding. */
export default async function Home() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.mustChangePassword) redirect("/cambiar-clave");
  if (ctx.activeOrg) redirect("/app");

  const res = await getResidentContext();
  if (res && res.units.length > 0) redirect("/portal");

  redirect("/onboarding");
}
