"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { setUnitFee } from "@/app/app/edificios/actions";
import { formatMoney } from "@/lib/format";

/** Muestra la cuota de mantenimiento de la unidad y permite editarla en línea. */
export function UnitFeeEditor({ unitId, fee }: { unitId: string; fee: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(fee));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-3">
        <span className="text-lg font-semibold">{formatMoney(fee)}</span>
        <button
          type="button"
          onClick={() => {
            setValue(String(fee));
            setError(null);
            setEditing(true);
          }}
          className="text-xs font-medium text-brand hover:underline"
        >
          editar
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="w-28 rounded-lg border border-line px-2 py-1 text-sm outline-none focus:border-brand"
      />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await setUnitFee(unitId, Number(value));
          setBusy(false);
          if (r.ok) {
            setEditing(false);
            router.refresh();
          } else {
            setError(r.error);
          }
        }}
        className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        Guardar
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-ink">
        Cancelar
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
