import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";

import { createResidentPass } from "@/app/portal/accesos/actions";
import { NewPassForm } from "@/components/forms/new-pass-form";
import { PASS_TYPE_LABEL, passState } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function PortalAccesosPage() {
  const res = await getResidentContext();
  const orgId = res?.orgId;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: mod } = await supabase
    .from("organization_modules")
    .select("module_key")
    .eq("organization_id", orgId)
    .eq("module_key", "accesos")
    .eq("enabled", true)
    .maybeSingle();
  if (!mod) notFound();

  const unitIds = res.units.map((u) => u.id);
  const { data: passes } = await supabase
    .from("visitor_passes")
    .select("id, code, visitor_name, type, valid_from, valid_to, status, max_uses, uses_count, unit_id")
    .in("unit_id", unitIds)
    .order("created_at", { ascending: false })
    .limit(100);

  const unitCode = new Map(res.units.map((u) => [u.id, u.code]));
  const unitOptions = res.units.map((u) => ({ id: u.id, label: u.code }));
  const list = passes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <QrCode className="size-6 text-brand" /> Mis visitas
        </h1>
        <p className="text-sm text-muted">
          Crea un pase y compártelo con tu visita; lo presenta en la garita.
        </p>
      </div>

      <NewPassForm units={unitOptions} action={createResidentPass} />

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Aún no has creado pases.
          </p>
        ) : (
          list.map((p) => {
            const st = passState(p);
            return (
              <Link
                key={p.id}
                href={`/portal/accesos/${p.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50"
              >
                <div className="min-w-0">
                  <p className="font-mono text-base font-semibold text-brand">{p.code}</p>
                  <p className="truncate font-medium">{p.visitor_name}</p>
                  <p className="text-xs text-muted">
                    {PASS_TYPE_LABEL[p.type]} · {unitCode.get(p.unit_id) ?? ""} · {formatDate(p.valid_to)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
