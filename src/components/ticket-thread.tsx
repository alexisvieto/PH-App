import { formatDate } from "@/lib/format";

export type ThreadMessage = {
  id: string;
  body: string;
  created_at: string;
  fromStaff: boolean;
};

export function TicketThread({ messages }: { messages: ThreadMessage[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted">Sin mensajes.</p>;
  }
  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`rounded-2xl border p-4 ${
            m.fromStaff
              ? "border-brand/30 bg-brand-soft/30"
              : "border-line bg-surface"
          }`}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-xs font-medium">
              {m.fromStaff ? "Administración" : "Residente"}
            </span>
            <span className="text-xs text-muted">{formatDate(m.created_at)}</span>
          </div>
          <p className="whitespace-pre-line text-sm text-ink/90">{m.body}</p>
        </div>
      ))}
    </div>
  );
}
