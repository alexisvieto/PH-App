import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { ActaVotacionPDF, type ActaData } from "@/components/pdf/acta-votacion-pdf";
import type { Brand } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { loadVotationResults, tallyFrom } from "@/lib/votations-server";

function dtShort(ts: string | null) {
  return ts
    ? new Date(ts).toLocaleString("es-PA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Panama" })
    : "—";
}

type RenderResult = { buffer: Buffer; filename: string } | { error: "not_found" | "not_closed" };

/**
 * Genera el acta en PDF de una votación CERRADA. Corre bajo la sesión del
 * usuario (RLS); la marca se pasa desde el contexto del llamador (staff o
 * residente, porque el residente no puede leer la tabla de organizaciones).
 */
export async function renderActaPdf(votationId: string, brand: Brand): Promise<RenderResult> {
  const supabase = await createClient();
  // Congela la foto inmutable si ya cerró (idempotente, write-once).
  await supabase.rpc("freeze_votation_result", { p_votation: votationId });

  const { data: v } = await supabase.from("votations").select("*").eq("id", votationId).maybeSingle();
  if (!v) return { error: "not_found" };
  // El acta solo existe cuando la votación ya cerró por su fecha de cierre.
  if (!v.closes_at || Date.now() < new Date(v.closes_at).getTime()) return { error: "not_closed" };

  // Umbrales tomados de la foto congelada (inmutables); fallback a los vivos.
  const snap = v.result_snapshot as { quorum_pct?: number | string; approval_pct?: number | string; kind?: string } | null;
  const quorumPct = Number(snap?.quorum_pct ?? v.quorum_pct);
  const approvalPct = Number(snap?.approval_pct ?? v.approval_pct);
  const kind = (snap?.kind ?? v.kind) as typeof v.kind;

  const [{ data: building }, results] = await Promise.all([
    supabase.from("buildings").select("name").eq("id", v.building_id).maybeSingle(),
    loadVotationResults(votationId),
  ]);
  if (!results) return { error: "not_found" };

  const t = tallyFrom(results, quorumPct, approvalPct, kind);
  const optionLabel = new Map(results.options.map((o) => [o.id, o.label]));

  const data: ActaData = {
    title: v.title,
    description: v.description,
    buildingName: building?.name ?? "Edificio",
    kindLabel: kind === "si_no" ? "Sí / No" : "Opción múltiple",
    opensAt: dtShort(v.opens_at),
    closesAt: dtShort(v.closes_at),
    quorumPct,
    approvalPct,
    generatedOn: new Date().toLocaleDateString("es-PA", { year: "numeric", month: "long", day: "numeric" }),
    tally: t,
    votes: results.votes.map((x) => ({
      unit_code: x.unit_code,
      choice: x.is_abstention ? "Abstención" : optionLabel.get(x.option_id ?? "") ?? "—",
      voted_at: dtShort(x.voted_at),
    })),
  };

  const buffer = await renderToBuffer(ActaVotacionPDF({ data, brand }));
  const safe = v.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "votacion";
  return { buffer, filename: `acta-${safe}.pdf` };
}
