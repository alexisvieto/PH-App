"use client";

import { useActionState } from "react";

import { changePassword } from "@/app/cambiar-clave/actions";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input = "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, EMPTY_ACTION_STATE);

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Nueva contraseña</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} placeholder="mín. 8 caracteres" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Confirmar contraseña</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={input} />
      </label>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton pendingText="Guardando…">Guardar y continuar</SubmitButton>
    </form>
  );
}
