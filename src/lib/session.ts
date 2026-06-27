import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import {
  brandFromOrg,
  type Brand,
  DEFAULT_BRAND,
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
  mustChangePassword: boolean;
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
      supabase.from("profiles").select("full_name, must_change_password").eq("id", user.id).maybeSingle(),
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
      mustChangePassword: profile?.must_change_password ?? false,
    };
  },
);

/** ¿El rol puede administrar (owner/administrador)? */
export function canManage(role: OrgRole | null): boolean {
  return role === "owner" || role === "administrador";
}

// =========================================================
// Admin de PLATAFORMA (Nexera). Privilegio cross-tenant para el panel /admin
// (hoy: publicidad de la red). Distinto de cualquier rol de organización.
// =========================================================
export type PlatformAdmin = { userId: string; email: string | null };

export const getPlatformAdmin = cache(
  async (): Promise<PlatformAdmin | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return null;
    return { userId: user.id, email: user.email ?? null };
  },
);

// =========================================================
// Contexto del RESIDENTE (portal). Un propietario que entró con su login
// (people.user_id = auth.uid()) ve solo SUS unidades.
// =========================================================

export type ResidentUnit = { id: string; code: string; buildingName: string };

export type ResidentContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  units: ResidentUnit[];
  residentType: "propietario" | "inquilino";
  brand: Brand;
  orgId: string | null;
  orgName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

type OrgBrandingWithId = OrgBranding & { id: string };

export const getResidentContext = cache(
  async (): Promise<ResidentContext | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [{ data: me }, { data: profile }] = await Promise.all([
      supabase.from("people").select("id").eq("user_id", user.id),
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]);

    const personIds = (me ?? []).map((p) => p.id);
    const base = {
      userId: user.id,
      email: user.email ?? null,
      fullName: profile?.full_name ?? null,
    };
    if (personIds.length === 0) {
      return {
        ...base,
        units: [],
        residentType: "propietario",
        brand: DEFAULT_BRAND,
        orgId: null,
        orgName: null,
        contactEmail: null,
        contactPhone: null,
      };
    }

    // El residente puede ser DUEÑO (unit_ownerships) o INQUILINO (unit_leases activo).
    const [{ data: owns }, { data: leased }] = await Promise.all([
      supabase
        .from("unit_ownerships")
        .select("unit_id")
        .eq("is_active", true)
        .in("person_id", personIds)
        .limit(50),
      supabase
        .from("unit_leases")
        .select("unit_id")
        .eq("is_active", true)
        .in("tenant_person_id", personIds)
        .limit(50),
    ]);
    const ownedIds = new Set((owns ?? []).map((o) => o.unit_id as string));
    const leasedIds = new Set((leased ?? []).map((l) => l.unit_id as string));
    const allIds = [...new Set([...ownedIds, ...leasedIds])];
    if (allIds.length === 0) {
      return {
        ...base,
        units: [],
        residentType: "propietario",
        brand: DEFAULT_BRAND,
        orgId: null,
        orgName: null,
        contactEmail: null,
        contactPhone: null,
      };
    }

    const { data: unitRows } = await supabase
      .from("units")
      .select(
        `id, code, building:buildings(name, org:organizations(id, ${ORG_BRAND_COLUMNS}))`,
      )
      .in("id", allIds);

    type ResUnit = {
      id: string;
      code: string;
      building: { name: string; org: OrgBrandingWithId | null } | null;
    };
    const rows = (unitRows ?? []) as ResUnit[];
    // v1: el portal opera sobre UNA organización: la de una unidad propia primero,
    // si no, la de una arrendada (selector multi-org = pendiente).
    const ownedRow = rows.find((u) => ownedIds.has(u.id) && u.building?.org);
    const org =
      ownedRow?.building?.org ??
      rows.find((u) => u.building?.org)?.building?.org ??
      null;
    const units: ResidentUnit[] = rows
      .filter((u) => !org || u.building?.org?.id === org.id)
      .map((u) => ({
        id: u.id,
        code: u.code,
        buildingName: u.building?.name ?? "Edificio",
      }));
    // Propietario si posee al menos una unidad en la org; si solo arrienda, inquilino.
    const ownsInOrg = rows.some(
      (u) => ownedIds.has(u.id) && (!org || u.building?.org?.id === org.id),
    );

    return {
      ...base,
      units,
      residentType: ownsInOrg ? "propietario" : "inquilino",
      brand: brandFromOrg(org),
      orgId: org?.id ?? null,
      orgName: org?.name ?? null,
      contactEmail: org?.contact_email ?? null,
      contactPhone: org?.contact_phone ?? null,
    };
  },
);
