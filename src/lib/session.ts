import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import {
  brandFromOrg,
  type Brand,
  type OrgBranding,
  ORG_BRAND_COLUMNS,
} from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/** Nombre de la cookie que recuerda la organización activa del staff. */
export const ACTIVE_ORG_COOKIE = "active_org";

type OrgRole = Database["public"]["Enums"]["org_role"];
type OrgType = Database["public"]["Enums"]["org_type"];

export type OrgRow = OrgBranding & {
  id: string;
  slug: string;
  type: OrgType;
  name: string;
};

export type Membership = {
  organization_id: string;
  role: OrgRole;
  org: OrgRow | null;
};

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  memberships: Membership[];
  activeOrg: OrgRow | null;
  role: OrgRole | null;
  brand: Brand;
};

/**
 * Contexto de sesión del staff. Envuelto en React.cache para deduplicar
 * la carga dentro de un mismo request (layout + page no la repiten).
 * La "org activa" es la primera membresía (Fase 1; luego habrá selector).
 */
export const getSessionContext = cache(
  async (): Promise<SessionContext | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [{ data: profile }, { data: rawMemberships }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("organization_members")
        .select(`organization_id, role, org:organizations(id, slug, type, ${ORG_BRAND_COLUMNS})`)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ]);

    const memberships = (rawMemberships ?? []) as unknown as Membership[];

    // Org activa: la guardada en cookie (si el usuario sigue siendo miembro),
    // o la primera membresía como fallback.
    const cookieStore = await cookies();
    const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
    const active =
      (preferred && memberships.find((m) => m.organization_id === preferred)) ||
      memberships[0] ||
      null;
    const activeOrg = active?.org ?? null;

    return {
      userId: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
      memberships,
      activeOrg,
      role: active?.role ?? null,
      brand: brandFromOrg(activeOrg),
    };
  },
);

/** ¿El rol puede administrar (owner/administrador)? */
export function canManage(role: OrgRole | null): boolean {
  return role === "owner" || role === "administrador";
}
