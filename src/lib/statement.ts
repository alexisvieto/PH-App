import "server-only";

import {
  brandFromOrg,
  type Brand,
  type OrgBranding,
  ORG_BRAND_COLUMNS,
} from "@/lib/brand";
import { CHARGE_CONCEPT_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";

export type Movement = {
  date: string; // YYYY-MM-DD
  kind: "cargo" | "pago";
  concept: string;
  debit: number; // cargo
  credit: number; // pago
  balance: number; // saldo corrido tras el movimiento
  paymentId?: string | null; // id del pago (para el recibo), solo en kind "pago"
};

export type UnitStatement = {
  unitId: string;
  unitCode: string;
  buildingName: string;
  ownerName: string | null;
  brand: Brand; // marca del tenant (derivada de la unidad) para los exportables
  movements: Movement[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
};

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Estado de cuenta de una unidad. NO recibe orgId: la RLS limita el acceso
 * (staff por membresía, residente por titularidad), así sirve a ambos.
 * Devuelve null si la unidad no es accesible o si falla la carga.
 */
export async function getUnitStatement(
  unitId: string,
): Promise<UnitStatement | null> {
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select(`id, code, building:buildings(name, org:organizations(${ORG_BRAND_COLUMNS}))`)
    .eq("id", unitId)
    .maybeSingle();
  if (!unit) return null;

  const [ownerRes, chargesRes, paymentsRes] = await Promise.all([
    supabase
      .from("unit_ownerships")
      .select("person:people(full_name), is_primary, share")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false }) // el propietario principal (contacto/responsable) primero
      .order("share", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("charges")
      .select("concept, description, period, amount, created_at")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select("id, amount, paid_on, method, reference, created_at")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true }),
  ]);

  if (chargesRes.error || paymentsRes.error) return null;

  type Raw = {
    date: string;
    kind: "cargo" | "pago";
    concept: string;
    debit: number;
    credit: number;
    ts: string;
    paymentId?: string | null;
  };
  const raw: Raw[] = [];

  for (const c of chargesRes.data ?? []) {
    raw.push({
      date: c.period ?? c.created_at.slice(0, 10),
      kind: "cargo",
      concept: c.description || CHARGE_CONCEPT_LABEL[c.concept],
      debit: cents(Number(c.amount ?? 0)),
      credit: 0,
      ts: c.created_at,
    });
  }
  for (const p of paymentsRes.data ?? []) {
    const ref = p.reference ? ` · ${p.reference}` : "";
    raw.push({
      date: p.paid_on,
      kind: "pago",
      concept: `Pago (${PAYMENT_METHOD_LABEL[p.method]})${ref}`,
      debit: 0,
      credit: cents(Number(p.amount ?? 0)),
      ts: p.created_at,
      paymentId: p.id,
    });
  }

  raw.sort((a, b) =>
    a.date < b.date
      ? -1
      : a.date > b.date
        ? 1
        : a.kind !== b.kind
          ? a.kind === "cargo"
            ? -1
            : 1
          : a.ts < b.ts
            ? -1
            : a.ts > b.ts
              ? 1
              : 0,
  );

  let running = 0;
  const movements: Movement[] = raw.map((m) => {
    running = cents(running + m.debit - m.credit);
    return {
      date: m.date,
      kind: m.kind,
      concept: m.concept,
      debit: m.debit,
      credit: m.credit,
      balance: running,
      paymentId: m.paymentId ?? null,
    };
  });

  const totalCharges = cents(raw.reduce((a, m) => a + m.debit, 0));
  const totalPayments = cents(raw.reduce((a, m) => a + m.credit, 0));

  const building = unit.building as {
    name: string;
    org: OrgBranding | null;
  } | null;

  return {
    unitId,
    unitCode: unit.code,
    buildingName: building?.name ?? "Edificio",
    ownerName:
      (ownerRes.data?.person as { full_name: string } | null)?.full_name ?? null,
    brand: brandFromOrg(building?.org ?? null),
    movements,
    totalCharges,
    totalPayments,
    balance: running,
  };
}
