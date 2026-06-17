import { FileBarChart } from "lucide-react";

import { isoDay } from "@/lib/format";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export default async function ReportesPage() {
  const ctx = await getSessionContext();
  const orgId = ctx?.activeOrg?.id;
  if (!orgId) return null;

  const supabase = await createClient();
  const { data: buildings } = await supabase
    .from("buildings")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes a la Junta Directiva</h1>
        <p className="text-sm text-muted">
          Resumen de novedades e incidentes del período, exportable a PDF con la marca.
        </p>
      </div>

      <form
        action="/app/reportes/jd"
        method="get"
        target="_blank"
        className="space-y-4 rounded-2xl border border-line bg-surface p-5"
      >
        <div className="flex items-center gap-2 text-brand">
          <FileBarChart className="size-5" />
          <h2 className="font-semibold">Generar reporte</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Desde</span>
            <input name="from" type="date" required defaultValue={isoDay(firstOfMonth)} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Hasta</span>
            <input name="to" type="date" required defaultValue={isoDay(now)} className={input} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Edificio</span>
            <select name="building" defaultValue="" className={input}>
              <option value="">Todos los edificios</option>
              {(buildings ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <FileBarChart className="size-4" /> Generar PDF
        </button>
      </form>

      <p className="text-xs text-muted">
        El reporte incluye comunicados y novedades publicados, quejas (tickets) y
        anomalías de mantenimiento registradas en el rango de fechas.
      </p>
    </div>
  );
}
