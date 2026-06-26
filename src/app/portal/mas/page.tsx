import { Building2, Mail, Phone, UserRound, type LucideIcon } from "lucide-react";

import { HubHeader, HubRow, HubSection } from "@/components/portal/hub";
import { getResidentContext } from "@/lib/session";

export default async function MasHub() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  return (
    <div className="space-y-6">
      <HubHeader title="Más" />

      {/* Perfil */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-tight">{res.fullName ?? "Residente"}</p>
          {res.email && <p className="truncate text-xs text-muted">{res.email}</p>}
        </div>
      </div>

      <HubSection title="Mis unidades">
        {res.units.map((u) => (
          <HubRow key={u.id} href={`/portal/unidades/${u.id}`} icon={Building2} color="slate" label={`Unidad ${u.code}`} sub={u.buildingName} />
        ))}
      </HubSection>

      {(res.contactEmail || res.contactPhone) && (
        <HubSection title="Administración">
          {res.contactEmail && <ContactRow icon={Mail} label="Correo" value={res.contactEmail} href={`mailto:${res.contactEmail}`} />}
          {res.contactPhone && <ContactRow icon={Phone} label="Teléfono" value={res.contactPhone} href={`tel:${res.contactPhone}`} />}
        </HubSection>
      )}

      <p className="px-1 text-center text-xs text-muted">Para cerrar sesión, usa “Salir” arriba a la derecha.</p>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors duration-200 hover:border-brand/50"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-tight">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{value}</span>
      </span>
    </a>
  );
}
