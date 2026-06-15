"use client";

import { useActionState, useState } from "react";
import { Building2, Home } from "lucide-react";

import { createOrgAction, type OnboardingState } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/submit-button";
import type { Database } from "@/lib/supabase/database.types";

type OrgType = Database["public"]["Enums"]["org_type"];

const initial: OnboardingState = { error: null };

const OPTIONS: {
  value: OrgType;
  title: string;
  desc: string;
  icon: typeof Building2;
}[] = [
  {
    value: "administradora",
    title: "Empresa administradora",
    desc: "Administro varios PH / edificios.",
    icon: Building2,
  },
  {
    value: "self_managed",
    title: "PH autogestionado",
    desc: "Un solo PH gobernado por su Junta Directiva.",
    icon: Home,
  },
];

export function OnboardingForm() {
  const [state, action] = useActionState(createOrgAction, initial);
  const [type, setType] = useState<OrgType>("administradora");

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type" value={type} />

      <div>
        <label className="mb-1 block text-sm font-medium">
          Nombre de la organización
        </label>
        <input
          name="name"
          required
          autoFocus
          className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          placeholder="Ej. Administradora Costa del Este, S.A."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Tipo</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((o) => {
            const active = type === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setType(o.value)}
                className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-brand bg-brand-soft/50"
                    : "border-line hover:border-brand/50"
                }`}
              >
                <o.icon className="size-5 text-brand" />
                <span className="text-sm font-medium">{o.title}</span>
                <span className="text-xs text-muted">{o.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" pendingText="Creando…">
        Crear organización
      </SubmitButton>
    </form>
  );
}
