import { notFound } from "next/navigation";
import { Settings, Users } from "lucide-react";

import { NewMemberForm } from "@/components/configuracion/team-form";
import { YappyConfigForm } from "@/components/configuracion/yappy-config-form";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getYappyConfig } from "@/lib/yappy";

const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  administrador: "Administrador",
  asistente: "Asistente",
  guardia: "Guardia",
};

export default async function ConfiguracionPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  if (!canManage(ctx.role)) notFound(); // solo owner/administrador

  const supabase = await createClient();
  const [yappy, { data: members }, { data: mod }] = await Promise.all([
    getYappyConfig(orgId),
    supabase.from("organization_members").select("role").eq("organization_id", orgId).eq("is_active", true),
    supabase
      .from("organization_modules")
      .select("module_key")
      .eq("organization_id", orgId)
      .eq("module_key", "accesos")
      .eq("enabled", true)
      .maybeSingle(),
  ]);
  const accesosActive = !!mod;

  const counts = new Map<string, number>();
  (members ?? []).forEach((m) => counts.set(m.role, (counts.get(m.role) ?? 0) + 1));
  const resumen = [...counts.entries()].map(([r, n]) => `${ROLE_LABEL[r] ?? r}: ${n}`).join(" · ");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Settings className="size-6 text-brand" /> Configuración
        </h1>
        <p className="text-sm text-muted">Ajustes de la organización.</p>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Users className="size-5 text-brand" /> Equipo del PH
        </h2>
        <p className="text-sm text-muted">
          Crea las cuentas de tu personal: <strong>administradores</strong>, <strong>asistentes</strong>
          {accesosActive ? (
            <>
              {" "}
              y <strong>guardias</strong> (garita)
            </>
          ) : null}
          . Cada uno entra en <strong>app.atrioph.net/login</strong> con su correo y la contraseña temporal que le des, y la
          cambia en su primer ingreso.
        </p>
        {resumen && <p className="text-xs text-muted">Equipo actual — {resumen}.</p>}

        <NewMemberForm accesosActive={accesosActive} />

        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <strong>¿Residentes?</strong> No se crean aquí. Regístralos en <strong>Propietarios</strong> con su correo; ellos
          crean su propia cuenta desde el login (solo funciona si su correo ya está en el padrón).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Pagos en línea · Yappy</h2>
        <p className="text-sm text-muted">
          Conecta la cuenta <strong>Yappy Comercial</strong> de este PH para que los residentes paguen su cuota desde la app.
          El dinero cae directo en la cuenta del PH. Las credenciales se guardan cifradas; el secret nunca se muestra.
        </p>
        <YappyConfigForm
          enabled={yappy?.enabled ?? false}
          merchantId={yappy?.merchantId ?? ""}
          sandbox={yappy?.sandbox ?? true}
          hasSecret={yappy?.hasSecret ?? false}
        />
      </section>
    </div>
  );
}
