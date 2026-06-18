"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

import { previewPayroll, type PayrollPreview } from "@/app/app/rrhh/actions";
import { formatMoney } from "@/lib/format";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type PayrollResult = Extract<PayrollPreview, { ok: true }>["result"];

const n = (v: string) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function PlanillaCalculator({ employeeId }: { employeeId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<PayrollResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const out = await previewPayroll(employeeId, {
      overtime: {
        diurna: n(String(f.get("ot_diurna") ?? "")),
        nocturna: n(String(f.get("ot_nocturna") ?? "")),
        mixta: n(String(f.get("ot_mixta") ?? "")),
        fiesta: n(String(f.get("ot_fiesta") ?? "")),
        fiestaDomingo: n(String(f.get("ot_fiesta_domingo") ?? "")),
      },
      commissions: 0,
      otherIncome: 0,
      otherDeductions: n(String(f.get("other_deductions") ?? "")),
    });
    setBusy(false);
    if (!out.ok) {
      setError(out.error);
      setRes(null);
      return;
    }
    setRes(out.result);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="size-5 text-brand" />
        <h2 className="font-semibold">Calculadora de planilla (mensual)</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">HE diurnas (h)</span>
            <input name="ot_diurna" type="number" min="0" step="0.5" defaultValue="0" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">HE nocturnas (h)</span>
            <input name="ot_nocturna" type="number" min="0" step="0.5" defaultValue="0" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">HE mixtas (h)</span>
            <input name="ot_mixta" type="number" min="0" step="0.5" defaultValue="0" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Día fiesta (h)</span>
            <input name="ot_fiesta" type="number" min="0" step="0.5" defaultValue="0" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">HE fiesta/domingo (h)</span>
            <input name="ot_fiesta_domingo" type="number" min="0" step="0.5" defaultValue="0" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Otras deducciones</span>
            <input name="other_deductions" type="number" min="0" step="0.01" defaultValue="0" className={input} />
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          <Calculator className="size-4" /> {busy ? "Calculando…" : "Calcular"}
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {res && (
        <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
          <Row label="Salario bruto" value={formatMoney(res.gross)} testid="gross" strong />
          {res.overtimeAmount > 0 && (
            <Row label="Horas extra" value={formatMoney(res.overtimeAmount)} testid="overtime" />
          )}
          <Row label="CSS empleado" value={`− ${formatMoney(res.cssEmployee)}`} testid="css" />
          <Row label="Seguro educativo" value={`− ${formatMoney(res.seguroEducativoEmployee)}`} testid="se" />
          <Row label="ISR" value={`− ${formatMoney(res.isr)}`} testid="isr" />
          {res.otherDeductions > 0 && (
            <Row label="Otras deducciones" value={`− ${formatMoney(res.otherDeductions)}`} testid="other" />
          )}
          <Row label="Salario neto" value={formatMoney(res.net)} testid="net" strong />
          <Row
            label="Costo patronal total"
            value={formatMoney(res.employerCost)}
            testid="employer"
          />
        </dl>
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
      <dd data-testid={`payroll-${testid}`}>{value}</dd>
    </div>
  );
}
