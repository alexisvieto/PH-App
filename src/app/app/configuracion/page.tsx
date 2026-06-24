import { notFound } from "next/navigation";
import { Settings } from "lucide-react";

import { YappyConfigForm } from "@/components/configuracion/yappy-config-form";
import { canManage, getSessionContext } from "@/lib/session";
import { getYappyConfig } from "@/lib/yappy";

export default async function ConfiguracionPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  if (!canManage(ctx.role)) notFound(); // solo owner/administrador

  const yappy = await getYappyConfig(orgId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Settings className="size-6 text-brand" /> Configuración
        </h1>
        <p className="text-sm text-muted">Ajustes de la organización.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Pagos en línea · Yappy</h2>
        <p className="text-sm text-muted">
          Conecta la cuenta <strong>Yappy Comercial</strong> de este PH para que los residentes
          paguen su cuota desde la app. El dinero cae directo en la cuenta del PH. Las credenciales
          se guardan cifradas; el secret nunca se muestra.
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
