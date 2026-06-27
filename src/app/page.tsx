import { redirect } from "next/navigation";

import { getPlatformAdmin, getResidentContext, getSessionContext } from "@/lib/session";

/** Resolver post-login: staff → /app, propietario → /portal, Nexera → /admin, nuevo → /onboarding. */
export default async function Home() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.mustChangePassword) redirect("/cambiar-clave");
  if (ctx.activeOrg) redirect("/app");

  // Admin de plataforma (Nexera) sin organización → al panel interno.
  const platform = await getPlatformAdmin();
  if (platform) redirect("/admin");

  const res = await getResidentContext();
  if (res && res.units.length > 0) redirect("/portal");

  redirect("/onboarding");
}
