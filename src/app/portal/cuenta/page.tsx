import { HardHat, PieChart, ReceiptText } from "lucide-react";

import { HubHeader, HubRow, HubSection } from "@/components/portal/hub";
import { blockTenant } from "@/lib/portal-guard";
import { getResidentContext } from "@/lib/session";

export default async function CuentaHub() {
  await blockTenant();
  const res = await getResidentContext();
  if (!res?.orgId) return null;
  const multi = res.units.length > 1;

  return (
    <div className="space-y-6">
      <HubHeader title="Cuenta" sub="Tu estado de cuenta y la transparencia del PH" />

      <HubSection title="Mi cuenta">
        {res.units.map((u) => (
          <HubRow
            key={u.id}
            href={`/portal/unidades/${u.id}`}
            icon={ReceiptText}
            color="emerald"
            label="Estado de cuenta"
            sub={multi ? `Unidad ${u.code}` : "Saldo, pagos y paz y salvo"}
          />
        ))}
      </HubSection>

      <HubSection title="Transparencia del PH">
        <HubRow href="/portal/finanzas" icon={PieChart} color="emerald" label="Finanzas del PH" sub="Ingresos y gastos del mes" />
        <HubRow href="/portal/proyectos" icon={HardHat} color="emerald" label="Proyectos" sub="Cotizaciones y obras" />
      </HubSection>
    </div>
  );
}
