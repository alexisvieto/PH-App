import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

/**
 * Fase REAL de una votación derivada de sus fechas (no del status manual): el
 * ciclo lo dictan `opens_at`/`closes_at`, no la administración. Una votación no
 * se cancela ni se abre/cierra a mano.
 */
export type VotationPhase = "programada" | "abierta" | "cerrada";

export function votationPhase(
  opensAt: string | null,
  closesAt: string | null,
  now: number = Date.now(),
): VotationPhase {
  if (opensAt && now < new Date(opensAt).getTime()) return "programada";
  if (closesAt && now >= new Date(closesAt).getTime()) return "cerrada";
  return "abierta";
}

export const VOTATION_PHASE_LABEL: Record<VotationPhase, string> = {
  programada: "Programada",
  abierta: "Abierta",
  cerrada: "Cerrada",
};

export const VOTATION_PHASE_STYLE: Record<VotationPhase, string> = {
  programada: "bg-amber-50 text-amber-700",
  abierta: "bg-emerald-50 text-emerald-700",
  cerrada: "bg-sky-50 text-sky-700",
};

export const DECISION_LABEL: Record<Tally["decision"], string> = {
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  sin_quorum: "Sin quórum",
};

export const DECISION_STYLE: Record<Tally["decision"], string> = {
  aprobada: "bg-emerald-600 text-white",
  rechazada: "bg-red-50 text-red-700",
  sin_quorum: "bg-gray-100 text-gray-500",
};

/** Clave (YYYY-MM) y etiqueta ("Junio 2026") del mes de un timestamp, en hora de Panamá. */
export function monthKeyOf(ts: string): string {
  return new Date(ts)
    .toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Panama" })
    .slice(0, 7);
}
export function monthLabelOf(ts: string): string {
  const s = new Date(ts).toLocaleDateString("es-PA", { month: "long", year: "numeric", timeZone: "America/Panama" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Agrupa elementos con fecha de cierre en meses (desc.), para el archivo en acordeón. */
export function groupByMonth<T>(items: T[], closesAt: (x: T) => string | null): { key: string; label: string; items: T[] }[] {
  const map = new Map<string, { key: string; label: string; items: T[] }>();
  for (const it of items) {
    const ts = closesAt(it);
    if (!ts) continue;
    const key = monthKeyOf(ts);
    if (!map.has(key)) map.set(key, { key, label: monthLabelOf(ts), items: [] });
    map.get(key)!.items.push(it);
  }
  return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

export type VoteRow = { option_id: string | null; is_abstention: boolean };
export type OptionRow = { id: string; label: string; sort_order: number };

export type Tally = {
  eligibleUnits: number; // electorado: unidades al día (Ley 284)
  votedUnits: number;
  abstentions: number;
  participationPct: number;
  quorumReached: boolean;
  options: { id: string; label: string; count: number; pct: number }[];
  decision: "aprobada" | "rechazada" | "sin_quorum";
  winnerId: string | null;
};

/**
 * Escrutinio POR UNIDAD (Ley 284): 1 unidad al día = 1 voto. El denominador de
 * quórum y de aprobación es el total de **unidades al día** del edificio (el
 * ausente cuenta como no-favorable). Para 'si_no', la opción de orden 0 es "Sí":
 * aprueba si Sí ≥ umbral del electorado. Para 'multiple', gana la más votada.
 */
export function tally(
  opts: OptionRow[],
  votes: VoteRow[],
  eligibleUnits: number,
  quorumPct: number,
  approvalPct: number,
  kind: Enums["votation_kind"],
): Tally {
  const sorted = [...opts].sort((a, b) => a.sort_order - b.sort_order);
  const eligible = Math.max(0, eligibleUnits);
  const votedUnits = votes.length;
  const abstentions = votes.filter((v) => v.is_abstention).length;
  const options = sorted.map((o) => {
    const count = votes.filter((v) => v.option_id === o.id).length;
    return { id: o.id, label: o.label, count, pct: eligible > 0 ? (count / eligible) * 100 : 0 };
  });

  const participationPct = eligible > 0 ? (votedUnits / eligible) * 100 : 0;
  const quorumReached = participationPct >= quorumPct;

  let decision: Tally["decision"] = "rechazada";
  let winnerId: string | null = null;
  if (!quorumReached) {
    decision = "sin_quorum";
  } else if (kind === "si_no") {
    const yes = options[0]; // orden 0 = "Sí"
    decision = (yes?.pct ?? 0) >= approvalPct ? "aprobada" : "rechazada";
    winnerId = decision === "aprobada" && yes ? yes.id : null;
  } else {
    const top = [...options].sort((a, b) => b.count - a.count)[0];
    winnerId = top && top.count > 0 ? top.id : null;
    decision = winnerId ? "aprobada" : "rechazada";
  }

  return { eligibleUnits: eligible, votedUnits, abstentions, participationPct, quorumReached, options, decision, winnerId };
}
