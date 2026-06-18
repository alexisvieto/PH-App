"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Pencil, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";

import {
  changeSalary,
  reactivateEmployee,
  terminateEmployee,
  updateEmployee,
} from "@/app/app/rrhh/actions";
import { EmployeeFormFields } from "@/components/forms/employee-form-fields";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { isoDay } from "@/lib/format";
import { TERMINATION_REASON_OPTIONS } from "@/lib/payroll/labels";
import type { Database } from "@/lib/supabase/database.types";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

type Panel = "edit" | "salary" | "baja" | null;
const n = (v: string) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function EmployeeAdmin({
  employee,
  buildings,
}: {
  employee: EmployeeRow;
  buildings: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);

  // Editar (form action). Cierre del panel por "ajuste en render con guard"
  // (no setState en efecto); el efecto solo dispara toast + refresh (sistemas externos).
  const [editState, editAction] = useActionState(updateEmployee, EMPTY_ACTION_STATE);
  const [seenEdit, setSeenEdit] = useState(editState);
  if (editState !== seenEdit) {
    setSeenEdit(editState);
    if (editState.ok && panel === "edit") setPanel(null);
  }
  useEffect(() => {
    if (editState.ok) {
      toast.success("Empleado actualizado.");
      router.refresh();
    }
  }, [editState, router]);

  const active = employee.status === "activo";

  async function onSalary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const res = await changeSalary(employee.id, {
      newSalary: n(String(f.get("new_salary") ?? "")),
      effectiveFrom: String(f.get("effective_from") ?? ""),
      note: String(f.get("note") ?? ""),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Salario actualizado.");
      setPanel(null);
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  async function onBaja(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const res = await terminateEmployee(employee.id, {
      reason: String(f.get("reason") ?? ""),
      date: String(f.get("date") ?? ""),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Empleado dado de baja.");
      setPanel(null);
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  async function onReactivate() {
    setBusy(true);
    const res = await reactivateEmployee(employee.id);
    setBusy(false);
    if (res.ok) {
      toast.success("Empleado reactivado.");
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPanel(panel === "edit" ? null : "edit")}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-gray-50"
        >
          <Pencil className="size-4" /> Editar
        </button>
        <button
          onClick={() => setPanel(panel === "salary" ? null : "salary")}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-gray-50"
        >
          <Wallet className="size-4" /> Cambio de salario
        </button>
        {active ? (
          <button
            onClick={() => setPanel(panel === "baja" ? null : "baja")}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Ban className="size-4" /> Dar de baja
          </button>
        ) : (
          <button
            onClick={onReactivate}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
          >
            <RotateCcw className="size-4" /> Reactivar
          </button>
        )}
      </div>

      {panel === "edit" && (
        <form action={editAction} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <input type="hidden" name="employee_id" value={employee.id} />
          <h2 className="font-semibold">Editar empleado</h2>
          <EmployeeFormFields buildings={buildings} d={employee} />
          <p className="text-xs text-muted">El salario base se cambia con “Cambio de salario”.</p>
          {editState.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{editState.error}</p>
          )}
          <div className="flex gap-2">
            <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
            <button type="button" onClick={() => setPanel(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {panel === "salary" && (
        <form onSubmit={onSalary} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Cambio de salario</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Nuevo salario base mensual (USD)</span>
              <input name="new_salary" type="number" min="0.01" step="0.01" required className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Vigente desde</span>
              <input name="effective_from" type="date" required defaultValue={isoDay(new Date())} className={input} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Nota</span>
              <input name="note" className={input} placeholder="Ej. Aumento anual" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />} Guardar
            </button>
            <button type="button" onClick={() => setPanel(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
          </div>
        </form>
      )}

      {panel === "baja" && (
        <form onSubmit={onBaja} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Dar de baja</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Motivo</span>
              <select name="reason" required defaultValue="" className={input}>
                <option value="" disabled>Selecciona…</option>
                {TERMINATION_REASON_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Fecha de baja</span>
              <input name="date" type="date" required defaultValue={isoDay(new Date())} className={input} />
            </label>
          </div>
          <p className="text-xs text-muted">
            La liquidación (finiquito) se calcula aparte en “Calculadora de liquidación”.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />} Confirmar baja
            </button>
            <button type="button" onClick={() => setPanel(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
