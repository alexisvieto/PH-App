import Link from "next/link";
import { notFound } from "next/navigation";
import { Package, PhoneCall, QrCode, Siren, type LucideIcon } from "lucide-react";

import { createResidentPass } from "@/app/portal/accesos/actions";
import { HubHeader } from "@/components/portal/hub";
import { NewPassForm } from "@/components/forms/new-pass-form";
import { isPassActive, PASS_TYPE_LABEL, passState } from "@/lib/access";
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
    .in("unit_id", unitIds.length ? unitIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(100);

  const unitCode = new Map(res.units.map((u) => [u.id, u.code]));
  const unitOptions = res.units.map((u) => ({ id: u.id, label: u.code }));
  // El propietario solo ve sus pases activos; los vencidos/agotados/anulados
  // desaparecen de su vista (el registro queda del lado del administrador).
  const list = (passes ?? []).filter(isPassActive);

  return (
    <div className="space-y-6">
      <HubHeader title="Accesos" sub="Visitas, citófono, paquetes y emergencias" />

      <div className="grid grid-cols-3 gap-2">
        <AccessChip href="/portal/citofono" icon={PhoneCall} label="Citófono" />
        <AccessChip href="/portal/paquetes" icon={Package} label="Paquetes" />
        <AccessChip href="/portal/sos" icon={Siren} label="SOS" danger />
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <QrCode className="size-5 text-brand" /> Mis visitas
        </h2>
        <p className="text-sm text-muted">Crea un pase y compártelo con tu visita; lo presenta en la garita.</p>
        <NewPassForm units={unitOptions} action={createResidentPass} />
      </section>

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            No tienes pases activos. Crea uno para tu próxima visita.
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
                    {PASS_TYPE_LABEL[p.type]} · {unitCode.get(p.unit_id) ?? ""} · {p.valid_to ? formatDate(p.valid_to) : "Indefinido"}
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

function AccessChip({ href, icon: Icon, label, danger = false }: { href: string; icon: LucideIcon; label: string; danger?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-sm font-medium transition-colors duration-200 ${
        danger ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-line bg-surface text-ink hover:border-brand/50"
      }`}
    >
      <Icon className={`size-6 ${danger ? "text-red-600" : "text-indigo-500"}`} />
      {label}
    </Link>
  );
}
