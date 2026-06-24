import "server-only";

import { createClient } from "@/lib/supabase/server";
import { tally, type OptionRow, type Tally } from "@/lib/votations";
import type { Database } from "@/lib/supabase/database.types";

type Kind = Database["public"]["Enums"]["votation_kind"];

export type ResultVote = {
  unit_code: string;
  option_id: string | null;
  is_abstention: boolean;
  weight: number;
  voted_at: string;
};
export type VotationResults = {
  totalCoef: number;
  options: OptionRow[];
  votes: ResultVote[];
};

/**
 * Carga el resultado de una votación vía RPC (funciona para staff y residentes;
 * el residente no puede leer la tabla `units` completa por RLS).
 */
export async function loadVotationResults(votationId: string): Promise<VotationResults | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_votation_results", { p_votation: votationId });
  if (error || !data) return null;
  const d = data as unknown as {
    total_coef: number | string;
    options: OptionRow[];
    votes: ResultVote[];
  };
  return {
    totalCoef: Number(d.total_coef) || 0,
    options: d.options ?? [],
    votes: d.votes ?? [],
  };
}

/** Escrutinio a partir del resultado cargado. */
export function tallyFrom(r: VotationResults, quorumPct: number, approvalPct: number, kind: Kind): Tally {
  return tally(r.options, r.votes, r.totalCoef, quorumPct, approvalPct, kind);
}
