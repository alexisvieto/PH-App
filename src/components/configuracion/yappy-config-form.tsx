"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveYappyConfig } from "@/app/app/configuracion/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function YappyConfigForm({
  enabled,
  merchantId,
  sandbox,
  hasSecret,
}: {
  enabled: boolean;
  merchantId: string;
  sandbox: boolean;
  hasSecret: boolean;
}) {
  const [state, action] = useActionState(saveYappyConfig, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (state.ok) toast.success("Configuración guardada.");
  }, [state]);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Merchant ID (Yappy Comercial)</span>
        <input name="merchant_id" defaultValue={merchantId} className={input} placeholder="ID del comercio" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Secret / API key</span>
        <input
          name="secret"
          type="password"
          autoComplete="off"
          className={input}
          placeholder={hasSecret ? "•••••••• (guardado — deja en blanco para no cambiarlo)" : "Pega el secret del comercio"}
        />
        <span className="mt-1 block text-xs text-muted">Se guarda cifrado (Vault) y nunca se muestra.</span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-2">
        <input type="checkbox" name="sandbox" defaultChecked={sandbox} className="size-4" />
        <span className="text-sm">Modo de prueba (sandbox)</span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-2">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="size-4" />
        <span className="text-sm">Activar pagos con Yappy para los residentes</span>
      </label>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
    </form>
  );
}
