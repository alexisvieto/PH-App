import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewAccountForm } from "@/components/contabilidad/new-account-form";
import { ACCOUNT_TYPE_PLURAL, type AccountType } from "@/lib/accounting";
import { canManage, getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const ORDER: AccountType[] = ["activo", "pasivo", "patrimonio", "ingreso", "gasto"];

export default async function CuentasPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;
  const isAdmin = canManage(ctx.role);

  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("ledger_accounts")
    .select("id, code, name, type, fund, is_system, active")
    .eq("organization_id", orgId)
    .order("code");
  const list = accounts ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/app/contabilidad"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Contabilidad
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Catálogo de cuentas</h1>
          <p className="text-sm text-muted">Estándar para PH (Ley 284). Puedes crear cuentas adicionales.</p>
        </div>
        {isAdmin && <NewAccountForm />}
      </div>

      {ORDER.map((type) => {
        const group = list.filter((a) => a.type === type);
        if (group.length === 0) return null;
        return (
          <section key={type} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{ACCOUNT_TYPE_PLURAL[type]}</h2>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <ul className="divide-y divide-line">
                {group.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="font-mono text-xs text-muted">{a.code}</span>
                      <span className="truncate">{a.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {a.fund === "imprevistos" && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Imprevistos
                        </span>
                      )}
                      {a.is_system && <span className="text-xs text-muted">estándar</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
