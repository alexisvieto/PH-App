"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldAlert, Siren } from "lucide-react";
import { toast } from "sonner";

import {
  cancelPanic,
  getPanicStatus,
  setPanicKind,
  triggerResidentPanic,
} from "@/app/portal/sos/actions";
import { HoldButton } from "@/components/access/hold-button";
import { createClient } from "@/lib/supabase/client";
import { PANIC_KIND_LABEL } from "@/lib/panic";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["panic_status"];
type Kind = Database["public"]["Enums"]["panic_kind"];
type Active = { id: string; status: Status; kind: Kind | null } | null;
const KINDS: Kind[] = ["medica", "seguridad", "incendio", "otro"];

export function PanicButton({
  units,
  active: initial,
}: {
  units: { id: string; code: string }[];
  active: Active;
}) {
  const router = useRouter();
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [active, setActive] = useState<Active>(initial);
  const [busy, setBusy] = useState(false);

  // Tiempo real: cuando el guardia atiende, el residente lo ve al instante.
  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`panic-${active.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "panic_alerts", filter: `id=eq.${active.id}` },
        (payload) => {
          const a = payload.new as { status: Status; kind: Kind | null };
          if (a.status === "resuelta" || a.status === "cancelada") {
            setActive(null);
            router.refresh();
          } else {
            setActive((p) => (p ? { ...p, status: a.status, kind: a.kind } : p));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [active, router]);

  // Sondeo de respaldo (3s): garantiza que el residente vea la atención aunque
  // el evento de Realtime no llegue. Crítico para un botón de pánico.
  useEffect(() => {
    if (!active) return;
    const id = active.id;
    const t = setInterval(async () => {
      const { status } = await getPanicStatus(id);
      if (!status || status === "resuelta" || status === "cancelada") {
        setActive(null);
        router.refresh();
      } else {
        setActive((p) => (p && p.status !== status ? { ...p, status } : p));
      }
    }, 3000);
    return () => clearInterval(t);
  }, [active, router]);

  async function fire() {
    if (busy || active) return;
    if (!unitId) return toast.error("Selecciona tu unidad.");
    setBusy(true);
    const res = await triggerResidentPanic(unitId);
    setBusy(false);
    if (res.ok) {
      setActive({ id: res.alertId, status: "activa", kind: null });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      toast.error(res.error);
    }
  }

  async function pickKind(k: Kind) {
    if (!active) return;
    setActive({ ...active, kind: k });
    await setPanicKind(active.id, k);
  }

  async function onCancel() {
    if (!active || busy) return;
    setBusy(true);
    await cancelPanic(active.id);
    setBusy(false);
    setActive(null);
    router.refresh();
  }

  // Estado SIN alerta activa: el gran botón de pánico.
  if (!active) {
    return (
      <div className="space-y-4">
        {units.length > 1 && (
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                Unidad {u.code}
              </option>
            ))}
          </select>
        )}
        <HoldButton
          onFire={fire}
          disabled={busy}
          className="flex aspect-square w-full max-w-xs mx-auto flex-col items-center justify-center gap-3 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 active:bg-red-700"
        >
          {busy ? (
            <Loader2 className="size-16 animate-spin" />
          ) : (
            <Siren className="size-20" />
          )}
          <span className="text-2xl font-bold">SOS</span>
          <span className="text-sm font-medium text-white/90">Mantén presionado</span>
        </HoldButton>
        <p className="text-center text-sm text-muted">
          Manténlo presionado 2 segundos para alertar a la garita.
        </p>
      </div>
    );
  }

  // Estado CON alerta activa: confirmación + tipo opcional + cancelar.
  const attended = active.status === "atendida";
  return (
    <div className="space-y-5">
      <div
        className={`rounded-3xl p-6 text-center text-white shadow-lg ${
          attended ? "bg-emerald-600" : "bg-red-600"
        }`}
      >
        {attended ? (
          <CheckCircle2 className="mx-auto size-12" />
        ) : (
          <ShieldAlert className="mx-auto size-12 animate-pulse" />
        )}
        <p className="mt-2 text-2xl font-bold">
          {attended ? "Ayuda en camino" : "SOS enviado"}
        </p>
        <p className="mt-1 text-sm text-white/90">
          {attended
            ? "El personal de seguridad ya está atendiendo tu emergencia."
            : "Avisando a la garita… mantén la calma."}
        </p>
      </div>

      {/* Tipo opcional (da contexto al guardia) */}
      <div>
        <p className="mb-2 text-sm font-medium">¿Qué tipo de emergencia? (opcional)</p>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => pickKind(k)}
              className={`min-h-12 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                active.kind === k
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-line bg-surface hover:bg-gray-50"
              }`}
            >
              {PANIC_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onCancel}
        disabled={busy}
        className="min-h-12 w-full rounded-xl border border-line px-4 py-3 text-sm font-medium text-muted transition hover:bg-gray-50 disabled:opacity-60"
      >
        Fue una falsa alarma — cancelar
      </button>
    </div>
  );
}
