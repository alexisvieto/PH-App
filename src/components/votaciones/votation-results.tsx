import type { Tally } from "@/lib/votations";

const pct = (n: number) => `${n.toFixed(1)}%`;

const DECISION: Record<Tally["decision"], { label: string; cls: string }> = {
  aprobada: { label: "Aprobada", cls: "bg-emerald-600 text-white" },
  rechazada: { label: "Rechazada", cls: "bg-red-600 text-white" },
  sin_quorum: { label: "Sin quórum", cls: "bg-gray-400 text-white" },
};

export function VotationResults({
  tally,
  quorumPct,
  approvalPct,
  closed,
}: {
  tally: Tally;
  quorumPct: number;
  approvalPct: number;
  closed: boolean;
}) {
  const d = DECISION[tally.decision];
  return (
    <div className="space-y-4">
      {/* Participación / quórum */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            <span className="font-semibold">Participación: {pct(tally.participationPct)}</span>{" "}
            <span className="text-muted">
              de las unidades al día ({tally.votedUnits}/{tally.eligibleUnits} · quórum {pct(quorumPct)})
            </span>
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              tally.quorumReached ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {tally.quorumReached ? "Quórum alcanzado" : "Sin quórum aún"}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-brand" style={{ width: `${Math.min(100, tally.participationPct)}%` }} />
        </div>
      </div>

      {/* Resultado por opción (conteo de unidades al día) */}
      <div className="space-y-3">
        {tally.options.map((o, i) => {
          const winner = tally.winnerId === o.id;
          return (
            <div key={o.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className={winner ? "font-semibold text-brand" : "font-medium"}>{o.label}</span>
                <span className="tabular-nums text-muted">
                  {o.count} {o.count === 1 ? "unidad" : "unidades"} · {pct(o.pct)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full ${winner ? "bg-brand" : i === 0 ? "bg-emerald-500" : "bg-gray-400"}`}
                  style={{ width: `${Math.min(100, o.pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Decisión */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{closed ? "Decisión:" : "Resultado preliminar:"}</span>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${d.cls}`}>{d.label}</span>
        <span className="text-xs text-muted">(umbral {pct(approvalPct)})</span>
      </div>
    </div>
  );
}
