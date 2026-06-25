"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

/** Sección de mes colapsable para el archivo de votaciones cerradas. */
export function MonthSection({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted">
            {count} {count === 1 ? "votación" : "votaciones"}
          </p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-muted">
          {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </span>
      </button>
      {open && <div className="space-y-2 border-t border-line bg-canvas p-2">{children}</div>}
    </div>
  );
}
