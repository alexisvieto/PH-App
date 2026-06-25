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

export type VoteRow = { option_id: string | null; is_abstention: boolean; weight: number | string };
export type OptionRow = { id: string; label: string; sort_order: number };

export type Tally = {
  totalCoef: number;
  votedWeight: number;
  abstWeight: number;
  participationPct: number;
  quorumReached: boolean;
  options: { id: string; label: string; weight: number; pct: number }[];
  decision: "aprobada" | "rechazada" | "sin_quorum";
  winnerId: string | null;
};

/**
 * Escrutinio ponderado por coeficiente. Para 'si_no', la opción de orden 0 es
 * la que aprueba ("Sí"). El % de cada opción se calcula sobre lo "decidido"
 * (excluye abstenciones). Aprueba si hay quórum y se alcanza el umbral.
 */
export function tally(
  opts: OptionRow[],
  votes: VoteRow[],
  totalCoef: number,
  quorumPct: number,
  approvalPct: number,
  kind: Enums["votation_kind"],
): Tally {
  const n = (v: number | string) => Number(v) || 0;
  const sorted = [...opts].sort((a, b) => a.sort_order - b.sort_order);
  const votedWeight = votes.reduce((s, v) => s + n(v.weight), 0);
  const abstWeight = votes.filter((v) => v.is_abstention).reduce((s, v) => s + n(v.weight), 0);
  const perOption = sorted.map((o) => ({
    id: o.id,
    label: o.label,
    weight: votes.filter((v) => v.option_id === o.id).reduce((s, v) => s + n(v.weight), 0),
  }));
  const decided = perOption.reduce((s, o) => s + o.weight, 0);
  const options = perOption.map((o) => ({ ...o, pct: decided > 0 ? (o.weight / decided) * 100 : 0 }));

  const participationPct = totalCoef > 0 ? (votedWeight / totalCoef) * 100 : 0;
  const quorumReached = participationPct >= quorumPct;

  let decision: Tally["decision"] = "rechazada";
  let winnerId: string | null = null;
  if (!quorumReached) {
    decision = "sin_quorum";
  } else if (kind === "si_no") {
    const yes = options[0]; // orden 0 = "Sí"
    decision = (yes?.pct ?? 0) >= approvalPct ? "aprobada" : "rechazada";
    winnerId = yes && (yes.pct ?? 0) >= approvalPct ? yes.id : null;
  } else {
    const top = [...options].sort((a, b) => b.weight - a.weight)[0];
    winnerId = top && top.weight > 0 ? top.id : null;
    decision = winnerId ? "aprobada" : "rechazada";
  }

  return { totalCoef, votedWeight, abstWeight, participationPct, quorumReached, options, decision, winnerId };
}
