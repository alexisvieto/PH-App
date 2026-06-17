"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { setAnomalyStatus } from "@/app/app/anomalias/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { ANOMALY_STATUS_OPTIONS } from "@/lib/maintenance";
import type { Database } from "@/lib/supabase/database.types";

type AnomalyStatus = Database["public"]["Enums"]["anomaly_status"];

export function AnomalyStatusControl({
  anomalyId,
  current,
}: {
  anomalyId: string;
  current: AnomalyStatus;
}) {
  const [state, action] = useActionState(setAnomalyStatus, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (state.ok) toast.success("Estado actualizado.");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="anomaly_id" value={anomalyId} />
      <select
        name="status"
        defaultValue={current}
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {ANOMALY_STATUS_OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <SubmitButton pendingText="…">Actualizar</SubmitButton>
    </form>
  );
}
