import { FileText, Trophy } from "lucide-react";

import { formatMoney } from "@/lib/format";

export type QuoteView = {
  id: string;
  companyName: string;
  amount: number;
  notes: string | null;
  isWinner: boolean;
};

/** Tarjeta de cotización (presentacional). `action` = control admin opcional (borrar). */
export function QuoteCard({
  quote,
  fileUrl,
  action,
}: {
  quote: QuoteView;
  fileUrl: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        quote.isWinner ? "border-emerald-300 bg-emerald-50/40" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {quote.companyName}
            {quote.isWinner && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                <Trophy className="size-3" /> Ganadora
              </span>
            )}
          </p>
          {quote.notes && <p className="mt-0.5 text-sm text-muted">{quote.notes}</p>}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <FileText className="size-4" /> Ver cotización
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-lg font-bold tabular-nums">{formatMoney(quote.amount)}</span>
          {action}
        </div>
      </div>
    </div>
  );
}
