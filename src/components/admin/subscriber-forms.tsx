"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { addOrgAdmin, onboardSubscriber, setOrgModule } from "@/app/admin/suscriptores/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

const input = "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function NewSubscriberForm() {
  const [state, action] = useActionState(onboardSubscriber, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Suscriptor creado. Comparte el correo y la contraseña con el responsable.");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nuevo suscriptor
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nuevo suscriptor</h2>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Nombre del PH / suscriptor</span>
        <input name="org_name" required className={input} placeholder="PH Vista Mar" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Tipo</span>
        <select name="org_type" defaultValue="administradora" className={input}>
          <option value="administradora">Administradora</option>
          <option value="self_managed">Autogestionado</option>
        </select>
      </label>

      <div className="border-t border-line pt-3">
        <p className="text-sm font-semibold">Responsable de la suscripción (usuario admin)</p>
        <p className="mb-2 text-xs text-muted">Crea su cuenta con una contraseña temporal; compártesela para que entre y la cambie.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Nombre</span>
            <input name="admin_name" required className={input} placeholder="Juan Pérez" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Correo</span>
            <input name="admin_email" type="email" required className={input} placeholder="admin@suedificio.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Contraseña temporal</span>
            <input name="admin_password" type="text" required minLength={6} className={input} placeholder="mín. 6 caracteres" />
          </label>
        </div>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear suscriptor</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function AddAdminForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(addOrgAdmin, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Admin agregado.");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-brand hover:underline">
        + Agregar admin
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg border border-line bg-canvas p-3">
      <input type="hidden" name="org_id" value={orgId} />
      <input name="admin_name" required placeholder="Nombre" className={input} />
      <input name="admin_email" type="email" required placeholder="Correo" className={input} />
      <input name="admin_password" type="text" required minLength={6} placeholder="Contraseña (mín. 6)" className={input} />
      {state.error && <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">{state.error}</p>}
      <div className="flex items-center gap-2">
        <SubmitButton pendingText="…">Agregar</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Activa/desactiva un módulo (add-on pago) de un suscriptor. */
export function OrgModuleToggle({ orgId, moduleKey, label, enabled }: { orgId: string; moduleKey: string; label: string; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await setOrgModule(orgId, moduleKey, !enabled);
        setBusy(false);
        router.refresh();
      }}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
        enabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
      title={enabled ? "Clic para desactivar" : "Clic para activar"}
    >
      <span className={`size-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-gray-400"}`} /> {label} · {enabled ? "activo" : "inactivo"}
    </button>
  );
}
