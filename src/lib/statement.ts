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

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Estado de cuenta de una unidad: cargos (débito) y pagos (crédito) en orden
 * cronológico con saldo corrido. RLS limita a la org del usuario.
 * Devuelve null si la unidad no existe o si falla la carga de movimientos
 * (no se muestra un estado de cuenta incompleto).
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

  const [ownerRes, chargesRes, paymentsRes] = await Promise.all([
    supabase
      .from("unit_ownerships")
      .select("person:people(full_name)")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("charges")
      .select("concept, description, period, amount, created_at")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select("amount, paid_on, method, reference, created_at")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true }),
  ]);

  // No mostramos un estado de cuenta mutilado si falló alguna consulta.
  if (chargesRes.error || paymentsRes.error) return null;

  type Raw = {
    date: string;
    kind: "cargo" | "pago";
    concept: string;
    debit: number;
    credit: number;
    ts: string; // created_at, para desempate cronológico estable
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
    });
  }

  // Orden determinista: fecha, luego cargo antes que pago, luego created_at.
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
    };
  });

  const totalCharges = cents(raw.reduce((a, m) => a + m.debit, 0));
  const totalPayments = cents(raw.reduce((a, m) => a + m.credit, 0));

  return {
    unitId,
    unitCode: unit.code,
    buildingName: (unit.building as { name: string } | null)?.name ?? "Edificio",
    ownerName:
      (ownerRes.data?.person as { full_name: string } | null)?.full_name ?? null,
    movements,
    totalCharges,
    totalPayments,
    balance: running, // fuente única de verdad (coincide con el último saldo corrido)
  };
}
