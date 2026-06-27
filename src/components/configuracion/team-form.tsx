"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";

import { createMember } from "@/app/app/configuracion/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input = "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function NewMemberForm({ accesosActive }: { accesosActive: boolean }) {
  const [state, action] = useActionState(createMember, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Usuario creado. Comparte el correo y la contraseña temporal con esa persona.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <UserPlus className="size-4" /> Agregar usuario
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <p className="font-semibold">Nuevo usuario del equipo</p>
      <p className="text-xs text-muted">
        Crea la cuenta con una contraseña temporal; compártela con la persona para que entre y la cambie en su primer ingreso.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input name="full_name" required className={input} placeholder="Nombre y apellido" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Correo</span>
          <input name="email" type="email" required className={input} placeholder="correo@ejemplo.com" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Rol</span>
          <select name="role" defaultValue="asistente" className={input}>
            <option value="administrador">Administrador</option>
            <option value="asistente">Asistente</option>
            {accesosActive && <option value="guardia">Guardia (garita)</option>}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Contraseña temporal</span>
          <input name="password" type="text" required minLength={6} className={input} placeholder="mín. 6 caracteres" />
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear usuario</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
