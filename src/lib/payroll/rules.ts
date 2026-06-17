import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Paquete legal resuelto (constantes + tasas + tramos) de un país en una fecha. */
export type RuleSet = {
  ruleSetId: string;
  countryCode: string;
  contributions: Record<
    string,
    { employeePct: number; employerPct: number; base: string; applies: boolean }
  >;
  brackets: { lower: number; upper: number | null; rate: number; baseFixed: number; ord: number }[];
  /** Constante de fórmula; null = no aplica (N/A) para ese país. */
  constants: Record<string, number | null>;
};

/**
 * Carga el paquete legal vigente para (país, fecha). Versionado y con vigencia:
 * cada cálculo debe guardar `ruleSetId` para ser reproducible si la ley cambia.
 */
export async function loadRuleSet(
  supabase: SupabaseClient<Database>,
  countryCode: string,
  onDate: string,
): Promise<RuleSet | null> {
  const { data: rs } = await supabase
    .from("legal_rule_sets")
    .select("id, country_code, effective_from, effective_to, version")
    .eq("country_code", countryCode)
    .lte("effective_from", onDate)
    .or(`effective_to.is.null,effective_to.gte.${onDate}`)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!rs) return null;

  const [{ data: contribs }, { data: brackets }, { data: constants }] =
    await Promise.all([
      supabase
        .from("contribution_rates")
        .select("concept, employee_pct, employer_pct, base, applies")
        .eq("rule_set_id", rs.id),
      supabase
        .from("tax_brackets")
        .select("ord, lower_bound, upper_bound, rate, base_fixed")
        .eq("rule_set_id", rs.id)
        .eq("tax", "isr")
        .order("ord", { ascending: true }),
      supabase
        .from("legal_constants")
        .select("key, num_value, applies")
        .eq("rule_set_id", rs.id),
    ]);

  const contributions: RuleSet["contributions"] = {};
  for (const c of contribs ?? [])
    contributions[c.concept] = {
      employeePct: Number(c.employee_pct),
      employerPct: Number(c.employer_pct),
      base: c.base,
      applies: c.applies,
    };

  const cmap: Record<string, number | null> = {};
  for (const k of constants ?? [])
    cmap[k.key] = k.applies && k.num_value !== null ? Number(k.num_value) : null;

  return {
    ruleSetId: rs.id,
    countryCode: rs.country_code,
    contributions,
    brackets: (brackets ?? []).map((b) => ({
      lower: Number(b.lower_bound),
      upper: b.upper_bound === null ? null : Number(b.upper_bound),
      rate: Number(b.rate),
      baseFixed: Number(b.base_fixed),
      ord: b.ord,
    })),
    constants: cmap,
  };
}
