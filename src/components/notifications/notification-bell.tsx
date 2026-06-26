"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CalendarDays, Check, MessageSquare, Volume2, VolumeX, Wallet } from "lucide-react";

import { useNotifications, type Notif } from "@/components/notifications/notifications-provider";

function iconFor(type: string) {
  if (type === "reserva_pendiente") return CalendarDays;
  if (type === "pago_registrado") return Wallet;
  return MessageSquare; // queja_nueva / queja_respuesta
}

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export function NotificationBell({ className = "", align = "right" }: { className?: string; align?: "left" | "right" }) {
  const router = useRouter();
  const { items, unread, muted, toggleMute, markRead, markAll } = useNotifications();
  const [open, setOpen] = useState(false);

  function openItem(n: Notif) {
    void markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
        className="relative flex size-9 items-center justify-center rounded-lg text-muted transition hover:bg-gray-100 hover:text-ink"
      >
        {unread > 0 ? <BellRing className="size-5 text-brand" /> : <Bell className="size-5" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl ${align === "left" ? "left-0" : "right-0"}`}>
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-sm font-semibold">Notificaciones</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  title={muted ? "Activar sonido" : "Silenciar sonido"}
                  className="rounded-md p-1.5 text-muted transition hover:bg-gray-100 hover:text-ink"
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                {unread > 0 && (
                  <button type="button" onClick={() => void markAll()} className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:underline">
                    Marcar todas
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-muted">Sin notificaciones pendientes.</p>
              ) : (
                items.map((n) => {
                  const Icon = iconFor(n.type);
                  return (
                    <div key={n.id} className="flex items-start gap-2 border-b border-line/60 px-3 py-2.5 transition hover:bg-gray-50">
                      <button type="button" onClick={() => openItem(n)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                        <Icon className="mt-0.5 size-4 shrink-0 text-brand" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{n.title}</span>
                          {n.body && <span className="block truncate text-xs text-muted">{n.body}</span>}
                          <span className="block text-[11px] text-muted">{relTime(n.created_at)}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void markRead(n.id)}
                        title="Marcar como leída"
                        className="shrink-0 rounded-md p-1 text-muted transition hover:bg-emerald-50 hover:text-emerald-600"
                      >
                        <Check className="size-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
