import { Building2 } from "lucide-react";

import { AddAdminForm, NewSubscriberForm, OrgModuleToggle } from "@/components/admin/subscriber-forms";
import { formatDate } from "@/lib/format";
import { ORG_TYPE_LABEL } from "@/lib/padron";
import { createClient } from "@/lib/supabase/server";

// Módulos (add-ons pagos) que Nexera activa por suscriptor.
const PLATFORM_MODULES = [{ key: "accesos", label: "Accesos y Seguridad" }];

export default async function SuscriptoresPage() {
  const supabase = await createClient();
  const [{ data: orgs }, { data: members }, { data: mods }] = await Promise.all([
    supabase.from("organizations").select("id, name, type, created_at").order("created_at", { ascending: false }),
    supabase.from("organization_members").select("organization_id").eq("is_active", true),
    supabase.from("organization_modules").select("organization_id, module_key, enabled"),
  ]);

  const memberCount = new Map<string, number>();
  (members ?? []).forEach((m) => memberCount.set(m.organization_id, (memberCount.get(m.organization_id) ?? 0) + 1));
  const enabledMods = new Map<string, Set<string>>();
  (mods ?? []).forEach((m) => {
    if (!m.enabled) return;
    if (!enabledMods.has(m.organization_id)) enabledMods.set(m.organization_id, new Set());
    enabledMods.get(m.organization_id)!.add(m.module_key);
  });
  const list = orgs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Building2 className="size-6 text-emerald-500" /> Suscriptores
          </h1>
          <p className="text-sm text-muted">
            {list.length} {list.length === 1 ? "organización" : "organizaciones"} · alta de nuevos PH y sus usuarios admin.
          </p>
        </div>
        <NewSubscriberForm />
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay suscriptores. Crea el primero.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <article key={o.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{o.name}</p>
                  <p className="text-xs text-muted">
                    {ORG_TYPE_LABEL[o.type]} · {memberCount.get(o.id) ?? 0} admin(s) · desde {formatDate(o.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted">Módulos:</span>
                {PLATFORM_MODULES.map((mod) => (
                  <OrgModuleToggle
                    key={mod.key}
                    orgId={o.id}
                    moduleKey={mod.key}
                    label={mod.label}
                    enabled={enabledMods.get(o.id)?.has(mod.key) ?? false}
                  />
                ))}
              </div>
              <div className="mt-2">
                <AddAdminForm orgId={o.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
