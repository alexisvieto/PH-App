import "server-only";

import { CHARGE_CONCEPT_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";

export type Movement = {
  date: string; // YYYY-MM-DD
  kind: "cargo" | "pago";
  concept: string;
  debit: number; // cargo
  credit: number; // pago
  balance: number; // saldo corrido tras el movimiento
};

export type UnitStatement = {
  unitId: string;
  unitCode: string;
  buildingName: string;
  ownerName: string | null;
  movements: Movement[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
};

/**
 * Estado de cuenta de una unidad: cargos (débito) y pagos (crédito) en orden
 * cronológico con saldo corrido. RLS limita a la org del usuario.
 */
export async function getUnitStatement(
  unitId: string,
  orgId: string,
): Promise<UnitStatement | null> {
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("id, code, building:buildings(name)")
    .eq("id", unitId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!unit) return null;

  const [{ data: owner }, { data: charges }, { data: payments }] =
    await Promise.all([
      supabase
        .from("unit_ownerships")
        .select("person:people(full_name)")
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("charges")
        .select("concept, description, period, amount, created_at")
        .eq("unit_id", unitId),
      supabase
        .from("payments")
        .select("amount, paid_on, method, reference")
        .eq("unit_id", unitId),
    ]);

  type Raw = Omit<Movement, "balance">;
  const raw: Raw[] = [];

  for (const c of charges ?? []) {
    raw.push({
      date: c.period ?? c.created_at.slice(0, 10),
      kind: "cargo",
      concept: c.description || CHARGE_CONCEPT_LABEL[c.concept],
      debit: Number(c.amount ?? 0),
      credit: 0,
    });
  }
  for (const p of payments ?? []) {
    const ref = p.reference ? ` · ${p.reference}` : "";
    raw.push({
      date: p.paid_on,
      kind: "pago",
      concept: `Pago (${PAYMENT_METHOD_LABEL[p.method]})${ref}`,
      debit: 0,
      credit: Number(p.amount ?? 0),
    });
  }

  // Orden cronológico estable (cargos antes que pagos en misma fecha por el push).
  raw.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let running = 0;
  const movements: Movement[] = raw.map((m) => {
    running += m.debit - m.credit;
    return { ...m, balance: running };
  });

  const totalCharges = raw.reduce((a, m) => a + m.debit, 0);
  const totalPayments = raw.reduce((a, m) => a + m.credit, 0);

  return {
    unitId,
    unitCode: unit.code,
    buildingName: (unit.building as { name: string } | null)?.name ?? "Edificio",
    ownerName:
      (owner?.person as { full_name: string } | null)?.full_name ?? null,
    movements,
    totalCharges,
    totalPayments,
    balance: totalCharges - totalPayments,
  };
}
