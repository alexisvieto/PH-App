"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { toast } from "sonner";

import {
  previewLiquidation,
  saveLiquidation,
  type LiquidationPreview,
} from "@/app/app/rrhh/actions";
import { formatMoney } from "@/lib/format";
import { TERMINATION_SCENARIO_OPTIONS } from "@/lib/payroll/labels";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type LiqResult = Extract<LiquidationPreview, { ok: true }>["result"];

const n = (v: string) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function LiquidationCalculator({
  employeeId,
  contractType,
}: {
  employeeId: string;
  contractType: "indefinido" | "definido";
}) {
  const router = useRouter();
  const [scenario, setScenario] = useState("despido_injustificado");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<LiqResult | null>(null);
  const [lastVars, setLastVars] = useState<Parameters<typeof saveLiquidation>[1] | null>(null);

  function readVars(form: HTMLFormElement) {
    const f = new FormData(form);
    return {
      scenario,
      terminationDate: String(f.get("termination_date") ?? ""),
      cumplioPreaviso: f.get("cumplio_preaviso") === "on",
      empresaDioPreaviso: f.get("empresa_dio_preaviso") === "on",
      incentivoPactado: n(String(f.get("incentivo") ?? "")),
      referenceSalary: n(String(f.get("reference_salary") ?? "")) || undefined,
    };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const vars = readVars(e.currentTarget);
    const out = await previewLiquidation(employeeId, vars);
    setBusy(false);
    if (!out.ok) {
      setError(out.error);
      setRes(null);
      return;
    }
    setRes(out.result);
    setLastVars(vars);
  }

  async function onSave() {
    if (!lastVars) return;
    setSaving(true);
    const out = await saveLiquidation(employeeId, lastVars);
    setSaving(false);
    if (out.ok) {
      toast.success("Liquidación guardada.");
      router.refresh();
    } else {
      toast.error(out.error ?? "No se pudo guardar.");
    }
  }

  const isDespido = scenario === "despido_injustificado";
  const isRenuncia = scenario === "renuncia";
  const isMutuo = scenario === "mutuo_acuerdo";

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Scale className="size-5 text-brand" />
        <h2 className="font-semibold">Calculadora de liquidación</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Escenario</span>
            <select
              name="scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className={input}
            >
              {TERMINATION_SCENARIO_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Fecha de terminación</span>
            <input name="termination_date" type="date" required className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Salario de referencia (opcional, promedio 6m o último)
            </span>
            <input name="reference_salary" type="number" min="0" step="0.01" className={input} placeholder="Por defecto, el base" />
          </label>
          {isMutuo && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Incentivo pactado</span>
              <input name="incentivo" type="number" min="0" step="0.01" defaultValue="0" className={input} />
            </label>
          )}
          {isRenuncia && (
            <label className="flex items-center gap-2 sm:col-span-2">
              <input name="cumplio_preaviso" type="checkbox" className="size-4" defaultChecked />
              <span className="text-sm">Cumplió el preaviso de 15 días (si no, se descuenta 1 semana)</span>
            </label>
          )}
          {isDespido && (
            <label className="flex items-center gap-2 sm:col-span-2">
              <input name="empresa_dio_preaviso" type="checkbox" className="size-4" />
              <span className="text-sm">La empresa dio el preaviso de 30 días (si no, se suma 1 mes)</span>
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <Scale className="size-4" /> {busy ? "Calculando…" : "Calcular liquidación"}
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {res && (
        <>
          <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
            <Row label="Años de servicio" value={String(res.yearsService)} testid="years" />
            <Row label="Vacaciones proporcionales" value={formatMoney(res.vacaciones)} testid="vacaciones" />
            <Row label="XIII mes proporcional" value={formatMoney(res.xiiiProporcional)} testid="xiii" />
            {contractType === "indefinido" && (
              <Row label="Prima de antigüedad" value={formatMoney(res.primaAntiguedad)} testid="prima" />
            )}
            {res.preaviso > 0 && (
              <Row label="Preaviso (1 mes)" value={formatMoney(res.preaviso)} testid="preaviso" />
            )}
            {res.indemnizacion > 0 && (
              <Row label="Indemnización (Art. 225)" value={formatMoney(res.indemnizacion)} testid="indemnizacion" />
            )}
            {res.incentivoPactado > 0 && (
              <Row label="Incentivo pactado" value={formatMoney(res.incentivoPactado)} testid="incentivo" />
            )}
            {res.penalidad > 0 && (
              <Row label="Penalidad por preaviso" value={`− ${formatMoney(res.penalidad)}`} testid="penalidad" />
            )}
            <Row label="Total a pagar" value={formatMoney(res.total)} testid="total" strong />
          </dl>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-4 rounded-lg border border-line px-4 py-2 text-sm font-medium text-brand transition hover:bg-gray-50 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar liquidación"}
          </button>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  testid,
  strong,
}: {
  label: string;
  value: string;
  testid: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-muted"}`}>
      <dt>{label}</dt>
      <dd data-testid={`liq-${testid}`}>{value}</dd>
    </div>
  );
}
