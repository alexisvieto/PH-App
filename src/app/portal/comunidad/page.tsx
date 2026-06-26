import { CalendarCheck, Megaphone, MessageSquareWarning, ShoppingBag, Vote, Wrench } from "lucide-react";

import { HubHeader, HubRow, HubSection } from "@/components/portal/hub";
import { getResidentContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function ComunidadHub() {
  const res = await getResidentContext();
  if (!res?.orgId) return null;

  const supabase = await createClient();
  const { count: areas } = await supabase
    .from("common_areas")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", res.orgId)
    .eq("active", true);
  const hasReservas = (areas ?? 0) > 0;

  return (
    <div className="space-y-6">
      <HubHeader title="Comunidad" sub="La vida del edificio en un solo lugar" />

      <HubSection title="Comunicación">
        <HubRow href="/portal/comunicados" icon={Megaphone} color="violet" label="Comunicados" sub="Avisos del edificio" />
        <HubRow href="/portal/votaciones" icon={Vote} color="violet" label="Votaciones" sub="Asambleas y decisiones" />
        <HubRow href="/portal/quejas" icon={MessageSquareWarning} color="violet" label="Quejas y solicitudes" sub="Escríbele a la administración" />
      </HubSection>

      <HubSection title="Servicios">
        <HubRow href="/portal/proveedores" icon={Wrench} color="violet" label="Proveedores" sub="Técnicos para tu hogar, con reseñas" />
        {hasReservas && (
          <HubRow href="/portal/reservas" icon={CalendarCheck} color="violet" label="Reservas" sub="Áreas comunes" />
        )}
        <HubRow href="/portal/a-domicilio" icon={ShoppingBag} color="violet" label="A domicilio" sub="Comida, súper y más" />
      </HubSection>
    </div>
  );
}
