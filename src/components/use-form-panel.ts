"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Feedback estándar para formularios con server actions:
 * - Muestra un toast de éxito en un efecto (sistema externo: permitido).
 * - Colapsa el panel al tener éxito mediante "ajuste de estado en render con
 *   guard" — NO con setState dentro del efecto (anti-patrón que dispara
 *   renders en cascada). Al colapsar, el formulario se desmonta y se limpia
 *   solo al reabrir.
 */
export function useFormPanel(
  state: { ok: boolean },
  successMessage: string,
): readonly [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(state);

  if (state !== seen) {
    setSeen(state);
    if (state.ok && open) setOpen(false);
  }

  useEffect(() => {
    if (state.ok) toast.success(successMessage);
  }, [state, successMessage]);

  return [open, setOpen] as const;
}
