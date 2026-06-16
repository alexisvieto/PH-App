import Link from "next/link";
import { notFound } from "next/navigation";

import { NewExpenseForm } from "@/components/forms/new-expense-form";
import { formatDate, formatMoney } from "@/lib/format";
import { EXPENSE_CATEGORY_LABEL } from "@/lib/finance";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function FinanzasPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { buildingId } = await params;
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: building } = await supabase
    .from("buildings")
    .select("id, name")
    .eq("id", buildingId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!building) notFound();

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("amount").eq("building_id", buildingId),
    supabase
      .from("expenses")
      .select("id, category, description, amount, spent_on, supplier")
      .eq("building_id", buildingId)
      .order("spent_on", { ascending: false })
      .limit(300),
  ]);

  const income = (payments ?? []).reduce((a, p) => a + Number(p.amount ?? 0), 0);
  const expenseList = expenses ?? [];
  const totalExpenses = expenseList.reduce((a, e) => a + Number(e.amount ?? 0), 0);
  const balance = income - totalExpenses;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/app/edificios/${buildingId}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {building.name}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Finanzas</h1>
        <p className="text-sm text-muted">
          Ingresos (pagos recibidos) y gastos del edificio.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-2xl font-semibold text-emerald-700">
            {formatMoney(income)}
          </p>
          <p className="text-sm text-muted">Ingresos</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-2xl font-semibold text-red-600">
            {formatMoney(totalExpenses)}
          </p>
          <p className="text-sm text-muted">Gastos</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p
            className={`text-2xl font-semibold ${balance >= 0 ? "text-ink" : "text-red-600"}`}
          >
            {formatMoney(balance)}
          </p>
          <p className="text-sm text-muted">Balance</p>
        </div>
      </div>

      <NewExpenseForm buildingId={buildingId} defaultDate={today} />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-3">
          <h2 className="font-semibold">Gastos</h2>
        </div>
        {expenseList.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Sin gastos registrados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-gray-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3 font-medium">Descripción</th>
                <th className="px-5 py-3 font-medium">Proveedor</th>
                <th className="px-5 py-3 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {expenseList.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-muted">{formatDate(e.spent_on)}</td>
                  <td className="px-5 py-3">{EXPENSE_CATEGORY_LABEL[e.category]}</td>
                  <td className="px-5 py-3">{e.description}</td>
                  <td className="px-5 py-3 text-muted">{e.supplier ?? "—"}</td>
                  <td className="px-5 py-3 text-right">{formatMoney(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
