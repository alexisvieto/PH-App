"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ACTIVE_ORG_COOKIE, getSessionContext } from "@/lib/session";

/**
 * Cambia la organización activa del staff. Valida que el usuario sea
 * miembro de esa org antes de fijar la cookie.
 */
export async function setActiveOrg(orgId: string): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx) return;
  if (!ctx.memberships.some((m) => m.organization_id === orgId)) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
