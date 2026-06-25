import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";

import { SupplierPaymentForm } from "@/components/contabilidad/supplier-payment-form";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function GastosPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  const isAdmin = canManage(ctx.role);

  const supabase = await createClient();
  const todayPa = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const [{ data: buildings }, { data: suppliers }, { data: expenses }] = await Promise.all([
    supabase.from("buildings").select("id, name").eq("organization_id", orgId).order("name"),
    supabase.from("suppliers").select("id, name").eq("organization_id", orgId).order("name"),
    supabase
      .from("expenses")
      .select("id, category, description, amount, spent_on, supplier, building_id")
      .eq("organization_id", orgId)
      .order("spent_on", { ascending: false })
      .limit(100),
  ]);
  const list = expenses ?? [];
  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, name: b.name }));
  const supplierOptions = (suppliers ?? []).map((s) => ({ id: s.id, name: s.name }));
  const buildingName = new Map((buildings ?? []).map((b) => [b.id, b.name]));
  const multiBuilding = buildingOptions.length > 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/app/contabilidad" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Contabilidad
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Truck className="size-6 text-brand" /> Pagos a proveedores
          </h1>
          <p className="text-sm text-muted">Cada pago registra el gasto y genera su asiento contable.</p>
        </div>
        {isAdmin && (
          <SupplierPaymentForm buildings={buildingOptions} suppliers={supplierOptions} defaultDate={todayPa} />
        )}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          Aún no hay pagos a proveedores registrados.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {list.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.supplier ?? "Proveedor no indicado"}</p>
                  <p className="truncate text-xs text-muted">
                    {e.description} · {EXPENSE_CATEGORY_LABEL[e.category]}
                    {multiBuilding ? ` · ${buildingName.get(e.building_id) ?? ""}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{formatMoney(Number(e.amount ?? 0))}</p>
                  <p className="text-xs text-muted">{e.spent_on ? formatDate(e.spent_on) : "—"}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
