"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveOvertimeIncidences, type OvertimeEntry } from "@/app/app/planilla/actions";

const input =
  "w-16 rounded-lg border border-line bg-white px-2 py-1 text-right text-sm outline-none focus:border-brand";

const FIELDS: { key: keyof Omit<OvertimeEntry, "employeeId">; label: string }[] = [
  { key: "diurna", label: "Diurna" },
  { key: "nocturna", label: "Nocturna" },
  { key: "mixta", label: "Mixta" },
  { key: "fiesta", label: "Día fiesta" },
  { key: "fiestaDomingo", label: "Fiesta/dom." },
];

type EmployeeOt = { id: string; name: string } & Omit<OvertimeEntry, "employeeId">;

export function OvertimeEditor({
  periodId,
  employees,
}: {
  periodId: string;
  employees: EmployeeOt[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const n = (k: string) => {
      const x = Number(f.get(k));
      return Number.isFinite(x) && x > 0 ? x : 0;
    };
    const entries: OvertimeEntry[] = employees.map((emp) => ({
      employeeId: emp.id,
      diurna: n(`ot-${emp.id}-diurna`),
      nocturna: n(`ot-${emp.id}-nocturna`),
      mixta: n(`ot-${emp.id}-mixta`),
      fiesta: n(`ot-${emp.id}-fiesta`),
      fiestaDomingo: n(`ot-${emp.id}-fiestaDomingo`),
    }));
    const res = await saveOvertimeIncidences(periodId, entries);
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Horas extra guardadas. Pulsa Procesar para recalcular.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  if (employees.length === 0) return null;

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="size-5 text-brand" />
        <h2 className="font-semibold">Horas extra del período</h2>
      </div>
      <p className="mb-4 text-xs text-muted">
        Ingreso manual de horas por tipo de jornada. Si quedan en 0, se calcula solo el salario base.
        Guarda y luego pulsa “Procesar”.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Empleado</th>
              {FIELDS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-right font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-line">
                <td className="py-2 pr-3">{emp.name}</td>
                {FIELDS.map((c) => (
                  <td key={c.key} className="px-2 py-2 text-right">
                    <input
                      name={`ot-${emp.id}-${c.key}`}
                      type="number"
                      min="0"
                      step="0.5"
                      defaultValue={emp[c.key] || ""}
                      placeholder="0"
                      className={input}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-brand transition hover:bg-gray-50 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Guardar horas extra
      </button>
    </form>
  );
}
